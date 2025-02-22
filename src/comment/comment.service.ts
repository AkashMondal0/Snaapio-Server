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

@Injectable()
export class CommentService {
  constructor(private readonly drizzleProvider: DrizzleProvider) { }

  async create(loggedUser: Author, createCommentInput: CreateCommentInput): Promise<Comment | GraphQLError> {
    try {
      const new_comment = await this.drizzleProvider.db.insert(CommentSchema).values({
        postId: createCommentInput.postId,
        content: createCommentInput.content,
        authorId: loggedUser.id
      }).returning();
      return {
        ...new_comment[0],
        user: loggedUser
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

  async findAll(loggedUser: Author, findCommentInput: GraphQLPageQuery): Promise<Comment[] | GraphQLError> {
    try {
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

      return comments

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