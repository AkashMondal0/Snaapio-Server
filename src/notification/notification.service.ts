import { Injectable } from '@nestjs/common';
import { CreateNotificationInput } from './dto/create-notification.input';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { Author } from 'src/users/entities/author.entity';
import { Notification } from './entities/notification.entity';
import { CommentSchema, ConversationSchema, MessagesSchema, NotificationSchema, PostSchema, UserSchema } from 'src/db/drizzle/drizzle.schema';
import { and, arrayContains, desc, eq, sql } from 'drizzle-orm';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
import { EventGateway } from 'src/event/event.gateway';
import { event_name } from 'src/configs/connection.name';

@Injectable()
export class NotificationService {
  constructor(
    private readonly drizzleProvider: DrizzleProvider,
    private readonly eventProvider: EventGateway
  ) { }

  async create(user: Author, createNotificationInput: CreateNotificationInput): Promise<Notification> {
    const data = await this.drizzleProvider.db.insert(NotificationSchema)
      .values({
        authorId: user.id,
        postId: createNotificationInput.postId,
        type: createNotificationInput.type,
        commentId: createNotificationInput.commentId,
        storyId: createNotificationInput.storyId,
        reelId: createNotificationInput.reelId,
        recipientId: createNotificationInput.recipientId,
      }).returning()
    const notificationData = {
      ...data[0],
      post: createNotificationInput.post,
      author: createNotificationInput.author,
    }
    this.eventProvider.publishMessage(event_name.notification.post, { ...notificationData, members: [createNotificationInput.recipientId] })
    return data[0] as Notification;
  }

  async findAll(user: Author, findAllNotificationInput: GraphQLPageQuery): Promise<Notification[] | any[]> {
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

    return data
  }

  async remove(user: Author, destroyNotificationInput: CreateNotificationInput): Promise<any> {
    await this.drizzleProvider.db.delete(NotificationSchema)
      .where(
        and(
          eq(NotificationSchema.authorId, user.id),
          eq(NotificationSchema.postId, destroyNotificationInput.postId),
          eq(NotificationSchema.type, destroyNotificationInput.type),
          eq(NotificationSchema.recipientId, destroyNotificationInput.recipientId)
        )
      )
    return true
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
}
