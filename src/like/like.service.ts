import { Injectable, Logger } from '@nestjs/common';
import { GraphQLError } from 'graphql';
import { FriendshipSchema, LikeSchema, UserSchema } from 'src/db/drizzle/drizzle.schema';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { and, eq, exists } from 'drizzle-orm';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
import { Author } from 'src/users/entities/author.entity';
import { CreateLikeInput } from './dto/create-like.input';
import { NotificationService } from 'src/notification/notification.service';
import { dataParser } from 'src/lib/dataParser';
import { RedisProvider } from 'src/db/redis/redis.provider';

@Injectable()
export class LikeService {
  constructor(private readonly drizzleProvider: DrizzleProvider,
    private readonly notificationService: NotificationService,
    private readonly redisProvider: RedisProvider

  ) { }

  // like find all
  async findAll(sessionUser: Author, searchById: GraphQLPageQuery): Promise<Author[] | GraphQLError> {
    try {
      const cKey = `likes:${searchById.id}:${searchById.offset}`;
      let cacheLikes = await this.redisProvider.client.get(cKey);
      if (cacheLikes) {
        return dataParser(cacheLikes);
      }
      if (sessionUser) {
        const likes = await this.drizzleProvider.db.select({
          id: UserSchema.id,
          username: UserSchema.username,
          email: UserSchema.email,
          profilePicture: UserSchema.profilePicture,
          name: UserSchema.name,
          following: exists(this.drizzleProvider.db.select()
            .from(FriendshipSchema).where(and(
              eq(FriendshipSchema.authorUsername, sessionUser.username),
              eq(FriendshipSchema.followingUsername, UserSchema.username),
            ))),
          followed_by: exists(this.drizzleProvider.db.select()
            .from(FriendshipSchema).where(and(
              eq(FriendshipSchema.authorUsername, UserSchema.username),
              eq(FriendshipSchema.followingUsername, sessionUser.username),
            ))),
        })
          .from(LikeSchema)
          .where(eq(LikeSchema.postId, searchById.id))
          .leftJoin(UserSchema, eq(LikeSchema.authorId, UserSchema.id))
          .limit(Number(searchById.limit) ?? 12)
          .offset(Number(searchById.offset) ?? 0)
        await this.redisProvider.client.set(cKey, JSON.stringify(likes), "EX", 60 * 5); // cache for 5 minutes
        return likes as Author[];

      } else {
        const likes = await this.drizzleProvider.db.select({
          id: UserSchema.id,
          username: UserSchema.username,
          email: UserSchema.email,
          profilePicture: UserSchema.profilePicture,
          name: UserSchema.name
        })
          .from(LikeSchema)
          .where(eq(LikeSchema.postId, searchById.id))
          .leftJoin(UserSchema, eq(LikeSchema.authorId, UserSchema.id))
          .limit(Number(searchById.limit) ?? 12)
          .offset(Number(searchById.offset) ?? 0)

        const NL = {
          ...likes,
          following: false,
          followed_by: false,
        } as Author[];

        await this.redisProvider.client.set(cKey, JSON.stringify(NL), "EX", 60 * 5); // cache for 5 minutes
        return NL;
      }
    } catch (error) {
      Logger.error(error)
      if (error instanceof GraphQLError) {
        throw error;
      } else {
        throw new GraphQLError('Internal Server Error', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  }

  // like create
  async likeAndDestroy(sessionUser: Author, input: CreateLikeInput): Promise<boolean | GraphQLError> {
    try {
      if (!input.like) {
        await this.drizzleProvider.db.delete(LikeSchema).where(and(
          eq(LikeSchema.authorId, sessionUser.id),
          eq(LikeSchema.postId, input.id)
        ));

        // delete notification 
        await this.notificationService.sendRemoveLikeOnPostNotification(sessionUser.id, input.id, input.recipientId);
        return false;
      }
      const check = await this.drizzleProvider.db.select({
        id: LikeSchema.id
      }).from(LikeSchema).where(and(
        eq(LikeSchema.authorId, sessionUser.id),
        eq(LikeSchema.postId, input.id)
      )).limit(1);

      if (check.length > 0) {
        await this.drizzleProvider.db.delete(LikeSchema).where(and(
          eq(LikeSchema.authorId, sessionUser.id),
          eq(LikeSchema.postId, input.id)
        ));

        // delete notification 
        await this.notificationService.sendRemoveLikeOnPostNotification(sessionUser.id, input.id, input.recipientId);
        return false;
      }

      await this.drizzleProvider.db.insert(LikeSchema).values({
        authorId: sessionUser.id,
        postId: input.id
      });

      // 
      await this.notificationService.sendLikeOnPostNotification(sessionUser, input.id, input.recipientId, input.postUrl);
      return true;

    } catch (error) {
      Logger.error(error);
      throw new GraphQLError('Internal Server Error', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }

}
