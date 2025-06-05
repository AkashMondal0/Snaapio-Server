import { Injectable } from '@nestjs/common';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { Author } from 'src/users/entities/author.entity';
import { Notification } from './entities/notification.entity';
import { CommentSchema, ConversationSchema, MessagesSchema, NotificationSchema, PostSchema, UserSchema } from 'src/db/drizzle/drizzle.schema';
import { and, arrayContains, desc, eq, sql } from 'drizzle-orm';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
import { EventGateway } from 'src/event/event.gateway';
import { event_name } from 'src/configs/connection.name';
import Expo from 'expo-server-sdk';
import expo from 'src/lib/expo';
import { RedisProvider } from 'src/db/redis/redis.provider';
import { Comment } from '../comment/entities/comment.entity';
import { dataParser } from 'src/lib/dataParser';

@Injectable()
export class NotificationService {
  constructor(
    private readonly drizzleProvider: DrizzleProvider,
    private readonly eventProvider: EventGateway,
    private readonly redisProvider: RedisProvider
  ) { }

  async ExpNotificationsSender(token: string, data: {
    title: string,
    body: string,
    channelId?: string,
    data?: {
      url: string,
    },
    richContent?: {
      image: string,
    },
  }): Promise<void> {
    // const { pushToken, title, body, imageUrl } = request.body as any;
    // Validate push token
    if (!Expo.isExpoPushToken(token)) {
      return;// response.send(`Invalid Expo push token`);
    }

    const message = {
      to: token,
      sound: 'default',
      title: data.title,
      body: data.body,
      channelId: data.channelId,
      data: data.data,
      richContent: data.richContent,
    };

    try {
      const chunks = expo.chunkPushNotifications([message]);

      const tickets: any = [];

      for (let chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
        } catch (error) {
          console.error('Chunk error:', error);
          return; // response.send(`Failed to send notification`);
        }
      }
      return; // response.send(`Expo push token success`);
    } catch (err) {
      console.error('Notification error:', err);
      return;// response.send(`Failed to send notification`);
    }
  }

  async findAll(user: Author, findAllNotificationInput: GraphQLPageQuery): Promise<Notification[] | any[]> {
    const cKey = `notifications:${user.id}:${findAllNotificationInput.offset}`;
    let cacheNotifications = await this.redisProvider.client.get(cKey);
    if (cacheNotifications) {
      return dataParser(cacheNotifications);
    }
    await this.markAsSeen(user)
    const data = await this.drizzleProvider.db.select({
      id: NotificationSchema.id,
      type: NotificationSchema.type,
      authorId: NotificationSchema.authorId,
      recipientId: NotificationSchema.recipientId,
      postId: NotificationSchema.postId,
      commentId: NotificationSchema.commentId,
      storyId: NotificationSchema.storyId,
      reelId: NotificationSchema.reelId,
      createdAt: NotificationSchema.createdAt,
      seen: NotificationSchema.authorId,
      author: {
        username: UserSchema.username,
        profilePicture: UserSchema.profilePicture,
      },
      post: {
        id: PostSchema.id,
        fileUrl: PostSchema.fileUrl,
      },
      comment: {
        id: CommentSchema.id,
        content: CommentSchema.content
      }
    })
      .from(NotificationSchema)
      .where(eq(NotificationSchema.recipientId, user.id))
      .leftJoin(UserSchema, eq(NotificationSchema.authorId, UserSchema.id))
      .leftJoin(PostSchema, eq(NotificationSchema.postId, PostSchema.id))
      .leftJoin(CommentSchema, eq(NotificationSchema.commentId, CommentSchema.id))
      .orderBy(desc(NotificationSchema.createdAt))
      .offset(findAllNotificationInput.offset ?? 0)
      .limit(findAllNotificationInput.limit ?? 12)

    if (data.length <= 0 || !data) {
      return []
    }
    await this.redisProvider.client.set(cKey, JSON.stringify(data), "EX", 60 * 5); // cache for 5 minutes
    return data
  }

  async markAsSeen(user: Author): Promise<boolean> {
    await this.drizzleProvider.db.update(NotificationSchema)
      .set({ seen: true })
      .where(and(
        eq(NotificationSchema.recipientId, user.id),
        eq(NotificationSchema.seen, false)
      ))
    return true
  }

  async UnseenNotifications(user: Author): Promise<{
    unreadPostCount: number,
    unreadCommentCount: number,
    unreadChatCount: number
  }> {
    const data = await this.drizzleProvider.db.select({
      unreadPostCount: sql`
      (SELECT COUNT(*) FROM ${NotificationSchema} WHERE ${NotificationSchema.recipientId} = ${user.id} AND ${NotificationSchema.type} = 'like' AND ${NotificationSchema.seen} = false)`,
      unreadCommentCount: sql`
      (SELECT COUNT(*) FROM ${NotificationSchema} WHERE ${NotificationSchema.recipientId} = ${user.id} AND ${NotificationSchema.type} = 'comment' AND ${NotificationSchema.seen} = false)`,
    })
      .from(UserSchema)
      .where(eq(UserSchema.id, user.id))
      .leftJoin(NotificationSchema, eq(NotificationSchema.recipientId, UserSchema.id))
      .groupBy(UserSchema.id)

    const UnreadChatCount = await this.drizzleProvider.db.select({
      totalUnreadCount: sql`(SELECT COUNT(*) 
      FROM ${MessagesSchema}
      WHERE ${MessagesSchema.conversationId} = ${ConversationSchema.id}
      AND NOT ${MessagesSchema.seenBy} @> ARRAY[${user.id}]::text[])`
    })
      .from(ConversationSchema)
      .where(arrayContains(ConversationSchema.members, [user.id]))
      .leftJoin(MessagesSchema, eq(MessagesSchema.conversationId, ConversationSchema.id))
      .groupBy(ConversationSchema.id)
      .limit(30)

    if (data.length <= 0) {
      return {
        unreadPostCount: 0,
        unreadCommentCount: 0,
        unreadChatCount: 0
      }
    }

    return {
      ...data[0],
      unreadChatCount: UnreadChatCount.filter((item) => Number(item.totalUnreadCount) !== 0).length || 0
    } as any
  }

  async UnseenMessageNotifications(user: Author): Promise<Number> {
    const data = await this.drizzleProvider.db.select({
      totalUnreadCount: sql`(SELECT COUNT(*) 
      FROM ${MessagesSchema}
      WHERE ${MessagesSchema.conversationId} = ${ConversationSchema.id}
      AND NOT ${MessagesSchema.seenBy} @> ARRAY[${user.id}]::text[])`
    })
      .from(ConversationSchema)
      .where(arrayContains(ConversationSchema.members, [user.id]))
      .leftJoin(MessagesSchema, eq(MessagesSchema.conversationId, ConversationSchema.id))
      .groupBy(ConversationSchema.id)
      .limit(30)

    if (data.length <= 0) {
      return 0
    }

    return data.filter((item) => Number(item.totalUnreadCount) !== 0).length || 0
  }

  // like notification
  async sendLikeOnPostNotification(user: Author, postId: string, recipientId: string, postUrl: string): Promise<Notification> {
    const data = await this.drizzleProvider.db.insert(NotificationSchema)
      .values({
        authorId: user.id,
        recipientId: recipientId,
        postId: postId,
        type: "like",
      }).returning();

    const notificationData = {
      ...data[0],
      postUrl: {
        id: postId,
        url: ""
      },
      author: user,
    };

    const ids = await this.eventProvider.findUserBySocketId([recipientId]);
    if (ids && ids.length > 0) {
      this.eventProvider.publishMessage(event_name.notification.post, { ...notificationData, members: [recipientId] });
    } else {
      const userNotificationId = await this.redisProvider.client.get(`notification:${recipientId}`)
      if (userNotificationId) {
        // console.log(userNotificationId)
        this.ExpNotificationsSender(userNotificationId, {
          title: `${user.name}`,
          body: `${user.name} liked your post`,
          channelId: postId,
          data: { url: `snaapio://post/${postId}` }
        })
      }
    }

    return data[0] as Notification;
  }

  async sendRemoveLikeOnPostNotification(userId: string, postId: string, recipientId: string): Promise<any> {
    await this.drizzleProvider.db.delete(NotificationSchema)
      .where(
        and(
          eq(NotificationSchema.authorId, userId),
          eq(NotificationSchema.postId, postId),
          eq(NotificationSchema.type, "like"),
          eq(NotificationSchema.recipientId, recipientId)
        )
      )
    return true
  }

  // like notification
  async sendCommentOnPostNotification(user: Author, comment: Comment, recipientId: string): Promise<Notification> {
    const data = await this.drizzleProvider.db.insert(NotificationSchema)
      .values({
        authorId: user.id,
        recipientId: recipientId,
        postId: comment.postId,
        commentId: comment.id,
        type: 'comment',
      }).returning();

    const notificationData = {
      ...data[0],
      postUrl: {
        id: comment.postId,
        url: ""
      },
      author: user,
    };

    const ids = await this.eventProvider.findUserBySocketId([recipientId]);
    if (ids && ids.length > 0) {
      this.eventProvider.publishMessage(event_name.notification.post, { ...notificationData, members: [recipientId] });
    } else {
      const userNotificationId = await this.redisProvider.client.get(`notification:${recipientId}`)
      if (userNotificationId) {
        // console.log(userNotificationId)
        this.ExpNotificationsSender(userNotificationId, {
          title: `${user.name} commented on your post`,
          body: comment.content || '...',
          channelId: comment.postId,
          data: { url: `snaapio://post/${comment.postId}/comments` }
        })
      }
    }

    return data[0] as Notification;
  }
  async sendRemoveCommentOnPostNotification(user: Author, postId: string, recipientId: string, postUrl: string): Promise<void> { }
}
