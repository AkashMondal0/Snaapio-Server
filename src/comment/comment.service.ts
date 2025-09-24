import { and, desc } from 'drizzle-orm';
import { Injectable, Logger } from '@nestjs/common';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { GraphQLError } from 'graphql';
import { CommentSchema, UserSchema } from 'src/db/drizzle/drizzle.schema';
import { eq } from 'drizzle-orm';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
import { Author } from 'src/users/entities/author.entity';
import { Comment } from './entities/comment.entity';
import { NotificationService } from 'src/notification/notification.service';
import { RedisProvider } from 'src/db/redis/redis.provider';
import { dataParser } from 'src/lib/dataParser';

@Injectable()
export class CommentService {
  constructor(private readonly drizzleProvider: DrizzleProvider,
    private readonly notificationService: NotificationService,
    private readonly redisProvider: RedisProvider
  ) { }

  async create(loggedUser: Author, createCommentInput: CreateCommentInput): Promise<Comment | GraphQLError> {
    try {
      const new_comment = await this.drizzleProvider.db.insert(CommentSchema).values({
        postId: createCommentInput.postId,
        content: createCommentInput.content,
        authorId: loggedUser.id
      }).returning();

      const rawData = {
        ...new_comment[0],
        user: loggedUser
      }
      // send notification
      this.notificationService.sendCommentOnPostNotification(loggedUser, rawData, createCommentInput.authorId)
      return rawData;
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

  async findAll(loggedUser: Author, findCommentInput: GraphQLPageQuery): Promise<Comment[] | GraphQLError> {
    try {
      const cKey = `comments:${findCommentInput.id}:${findCommentInput.offset}`;
      let cacheComment = await this.redisProvider.client.get(cKey);
      if (cacheComment) {
        return dataParser(cacheComment);
      }
      const comments = await this.drizzleProvider.db.select({
        id: CommentSchema.id,
        postId: CommentSchema.postId,
        content: CommentSchema.content,
        authorId: CommentSchema.authorId,
        createdAt: CommentSchema.createdAt,
        user: {
          id: UserSchema.id,
          username: UserSchema.username,
          email: UserSchema.email,
          profilePicture: UserSchema.profilePicture,
          name: UserSchema.name,
        }
      })
        .from(CommentSchema)
        .where(eq(CommentSchema.postId, findCommentInput.id))
        .leftJoin(UserSchema, eq(CommentSchema.authorId, UserSchema.id))
        .orderBy(desc(CommentSchema.createdAt))
        .limit(10)
        .offset(0)

      await this.redisProvider.client.set(cKey, JSON.stringify(comments), "EX", 60 * 5); // Cache for 5 minutes
      return comments;

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

  async update(loggedUser: Author, CommentInput: UpdateCommentInput): Promise<{ status: boolean } | GraphQLError> {

    try {
      await this.drizzleProvider.db.update(CommentSchema)
        .set({
          content: "Updated Content"
        })
        .where(eq(CommentSchema.id, "e80a990c-e769-4a79-83d9-01988596fbdf"))

      return { status: true }

    } catch (error) {
      Logger.error(error)
      if (error instanceof GraphQLError) {
        throw error;
      } else {
        throw new GraphQLError('Internal Server Error (update comment)', {
          extensions: { code: 'INTERNAL_SERVER_ERROR' }
        });
      }
    }
  }

  async remove(loggedUser: Author, commentId: string): Promise<{ status: boolean } | GraphQLError> {
    try {
      await this.drizzleProvider.db.delete(CommentSchema)
        .where(
          and(
            eq(CommentSchema.id, commentId),
            eq(CommentSchema.authorId, loggedUser.id)
          ))

      return { status: true }

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
}