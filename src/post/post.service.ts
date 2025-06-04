
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { count, eq, desc, exists, and, sql } from "drizzle-orm";
import { GraphQLError } from 'graphql';
import { CommentSchema, FriendshipSchema, LikeSchema, PostSchema, UserSchema } from 'src/db/drizzle/drizzle.schema';
import { CreatePostInput } from './dto/create-post.input';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
import { Author } from 'src/users/entities/author.entity';
import { Post } from './entities/post.entity';
import { shortUploadType } from 'src/image/entities/image.entity';
import { RedisProvider } from 'src/db/redis/redis.provider';
import { dataParser } from 'src/lib/dataParser';

@Injectable()
export class PostService {
  constructor(private readonly drizzleProvider: DrizzleProvider,
    private readonly redisProvider: RedisProvider
  ) { }

  async feed(loggedUser: Author, limitAndOffset: GraphQLPageQuery): Promise<Post[]> {
    try {
      const cacheKey = `feed:user:${loggedUser.id}:offset:${limitAndOffset.offset}`;
      let feed = await this.redisProvider.client.get(cacheKey) as any;

      if (feed) {
        return dataParser(feed);
      }

      const data = await this.drizzleProvider.db.select({
        id: PostSchema.id,
        content: PostSchema.content,
        fileUrl: PostSchema.fileUrl,
        createdAt: PostSchema.createdAt,
        updatedAt: PostSchema.updatedAt,
        // 
        song: PostSchema.song,
        tags: PostSchema.tags,
        locations: PostSchema.locations,
        country: PostSchema.country,
        city: PostSchema.city,
        likes: PostSchema.likes,
        comments: PostSchema.comments,
        // join
        likeCount: sql`COUNT(DISTINCT ${LikeSchema.id}) AS likeCount`,
        commentCount: sql`COUNT(DISTINCT ${CommentSchema.id}) AS commentCount`,
        is_Liked: exists(this.drizzleProvider.db.select().from(LikeSchema).where(and(
          eq(LikeSchema.authorId, loggedUser.id), // <-  logged user id
          eq(LikeSchema.postId, PostSchema.id)
        ))),
        user: {
          id: UserSchema.id,
          username: UserSchema.username,
          email: UserSchema.email,
          profilePicture: UserSchema.profilePicture,
          name: UserSchema.name,
          followed_by: exists(this.drizzleProvider.db.select().from(FriendshipSchema).where(and(
            eq(FriendshipSchema.followingUserId, loggedUser.id),// <-  logged user id
            eq(FriendshipSchema.authorUserId, UserSchema.id)
          ))),
          following: exists(this.drizzleProvider.db.select().from(FriendshipSchema).where(and(
            eq(FriendshipSchema.followingUserId, UserSchema.id),
            eq(FriendshipSchema.authorUserId, loggedUser.id)
          ))),
        },
      })
        .from(PostSchema)
        .leftJoin(LikeSchema, eq(PostSchema.id, LikeSchema.postId))
        .leftJoin(CommentSchema, eq(PostSchema.id, CommentSchema.postId))
        .where(and(
          eq(FriendshipSchema.followingUserId, PostSchema.authorId),
          eq(PostSchema.status, "published"),
          eq(PostSchema.type, "post"),
        ))
        .innerJoin(FriendshipSchema, eq(FriendshipSchema.authorUserId, loggedUser.id))
        .leftJoin(UserSchema, eq(PostSchema.authorId, UserSchema.id))
        .orderBy(desc(PostSchema.createdAt))
        .groupBy(
          PostSchema.id,
          UserSchema.id,
        )
        .limit(limitAndOffset.limit ?? 12)
        .offset(limitAndOffset.offset ?? 0);

      await this.redisProvider.client.set(cacheKey, JSON.stringify(data), 'EX', 60); // short TTL
      return data as Post[];
    } catch (error) {
      Logger.error(error);
      throw new GraphQLError('Internal Server Error', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }

  async shortFeed(loggedUser: Author, limitAndOffset: GraphQLPageQuery): Promise<Post[]> {
    try {
      const cacheKey = `shortFeed:user:${loggedUser.id}:offset:${limitAndOffset.offset}`;
      let feed = await this.redisProvider.client.get(cacheKey) as any;

      if (feed) {
        return dataParser(feed);
      }

      const data = await this.drizzleProvider.db.select({
        id: PostSchema.id,
        content: PostSchema.content,
        fileUrl: PostSchema.fileUrl,
        createdAt: PostSchema.createdAt,
        updatedAt: PostSchema.updatedAt,
        title: PostSchema.title,
        // 
        song: PostSchema.song,
        tags: PostSchema.tags,
        locations: PostSchema.locations,
        country: PostSchema.country,
        city: PostSchema.city,
        likes: PostSchema.likes,
        comments: PostSchema.comments,
        // join
        likeCount: sql`COUNT(DISTINCT ${LikeSchema.id}) AS likeCount`,
        commentCount: sql`COUNT(DISTINCT ${CommentSchema.id}) AS commentCount`,
        is_Liked: exists(this.drizzleProvider.db.select().from(LikeSchema).where(and(
          eq(LikeSchema.authorId, loggedUser.id), // <-  logged user id
          eq(LikeSchema.postId, PostSchema.id)
        ))),
        user: {
          id: UserSchema.id,
          username: UserSchema.username,
          email: UserSchema.email,
          profilePicture: UserSchema.profilePicture,
          name: UserSchema.name,
          followed_by: exists(this.drizzleProvider.db.select().from(FriendshipSchema).where(and(
            eq(FriendshipSchema.followingUserId, loggedUser.id),// <-  logged user id
            eq(FriendshipSchema.authorUserId, UserSchema.id)
          ))),
          following: exists(this.drizzleProvider.db.select().from(FriendshipSchema).where(and(
            eq(FriendshipSchema.followingUserId, UserSchema.id),
            eq(FriendshipSchema.authorUserId, loggedUser.id)
          ))),
        },
      })
        .from(PostSchema)
        .leftJoin(LikeSchema, eq(PostSchema.id, LikeSchema.postId))
        .leftJoin(CommentSchema, eq(PostSchema.id, CommentSchema.postId))
        .where(and(
          eq(FriendshipSchema.followingUserId, PostSchema.authorId),
          eq(PostSchema.status, "published"),
          eq(PostSchema.type, "short"),
        ))
        .innerJoin(FriendshipSchema, eq(FriendshipSchema.authorUserId, loggedUser.id))
        .leftJoin(UserSchema, eq(PostSchema.authorId, UserSchema.id))
        .orderBy(desc(PostSchema.createdAt))
        .groupBy(
          PostSchema.id,
          UserSchema.id,
        )
        .limit(limitAndOffset.limit ?? 12)
        .offset(limitAndOffset.offset ?? 0);

      await this.redisProvider.client.set(cacheKey, JSON.stringify(data), 'EX', 60); // short TTL
      return data as Post[];
    } catch (error) {
      Logger.error(error);
      throw new GraphQLError('Internal Server Error', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }

  async findPosts(loggedUser: Author, findPosts: GraphQLPageQuery): Promise<Post[] | GraphQLError> {
    try {
      const data = await this.drizzleProvider.db.select({
        id: PostSchema.id,
        content: PostSchema.content,
        fileUrl: PostSchema.fileUrl,
        type: PostSchema.type,
        likeCount: sql`COUNT(DISTINCT ${LikeSchema.id}) AS likeCount`,
        commentCount: sql`COUNT(DISTINCT ${CommentSchema.id}) AS commentCount`,
        createdAt: PostSchema.createdAt,
        updatedAt: PostSchema.updatedAt,
      })
        .from(PostSchema)
        .leftJoin(LikeSchema, eq(PostSchema.id, LikeSchema.postId))
        .leftJoin(CommentSchema, eq(PostSchema.id, CommentSchema.postId))
        .where(eq(PostSchema.authorId, findPosts.id))
        .orderBy(desc(PostSchema.createdAt))
        .limit(Number(findPosts.limit) ?? 12)
        .offset(Number(findPosts.offset) ?? 0)
        .groupBy(PostSchema.id, CommentSchema.postId)

      return data as Post[]
    } catch (error) {
      Logger.error(error)
      throw new GraphQLError(error)
    }
  }

  async findOnePost(loggedUser: Author, id: string): Promise<Post | GraphQLError> {
    try {
      if (loggedUser) {
        const _data = await this.drizzleProvider.db.select({
          id: PostSchema.id,
          content: PostSchema.content,
          title: PostSchema.title,
          fileUrl: PostSchema.fileUrl,
          // 
          song: PostSchema.song,
          tags: PostSchema.tags,
          locations: PostSchema.locations,
          country: PostSchema.country,
          city: PostSchema.city,
          likes: PostSchema.likes,
          type: PostSchema.type,
          comments: PostSchema.comments,
          // join
          likeCount: sql`COUNT(DISTINCT ${LikeSchema.id}) AS likeCount`,
          commentCount: sql`COUNT(DISTINCT ${CommentSchema.id}) AS commentCount`,
          createdAt: PostSchema.createdAt,
          updatedAt: PostSchema.updatedAt,
          is_Liked: exists(this.drizzleProvider.db.select().from(LikeSchema).where(and(
            eq(LikeSchema.authorId, loggedUser.id), // <- replace with user id
            eq(LikeSchema.postId, PostSchema.id)
          ))),
          user: {
            id: UserSchema.id,
            username: UserSchema.username,
            email: UserSchema.email,
            profilePicture: UserSchema.profilePicture,
            name: UserSchema.name,
          },
        }).from(PostSchema)
          .where(eq(PostSchema.id, id))
          .limit(1)
          .leftJoin(LikeSchema, eq(PostSchema.id, LikeSchema.postId))
          .leftJoin(CommentSchema, eq(PostSchema.id, CommentSchema.postId))
          .leftJoin(UserSchema, eq(PostSchema.authorId, UserSchema.id))
          .groupBy(PostSchema.id, UserSchema.id, CommentSchema.postId)

        return _data[0] as Post
      } else {
        const _data = await this.drizzleProvider.db.select({
          id: PostSchema.id,
          content: PostSchema.content,
          fileUrl: PostSchema.fileUrl,
          // 
          song: PostSchema.song,
          tags: PostSchema.tags,
          locations: PostSchema.locations,
          country: PostSchema.country,
          city: PostSchema.city,
          likes: PostSchema.likes,
          comments: PostSchema.comments,
          // join
          likeCount: sql`COUNT(DISTINCT ${LikeSchema.id}) AS likeCount`,
          commentCount: sql`COUNT(DISTINCT ${CommentSchema.id}) AS commentCount`,
          createdAt: PostSchema.createdAt,
          updatedAt: PostSchema.updatedAt,
          user: {
            id: UserSchema.id,
            username: UserSchema.username,
            email: UserSchema.email,
            profilePicture: UserSchema.profilePicture,
            name: UserSchema.name,
          },
        }).from(PostSchema)
          .where(eq(PostSchema.id, id))
          .limit(1)
          .leftJoin(LikeSchema, eq(PostSchema.id, LikeSchema.postId))
          .leftJoin(CommentSchema, eq(PostSchema.id, CommentSchema.postId))
          .leftJoin(UserSchema, eq(PostSchema.authorId, UserSchema.id))
          .groupBy(PostSchema.id, UserSchema.id, CommentSchema.postId)

        return _data[0] as Post
      }

    } catch (error) {
      Logger.error(error)
      throw new GraphQLError(error)
    }
  }

  //findPublicPostData
  async findPublicPostData(id: string): Promise<Post | null> {
    try {
      const data = await this.drizzleProvider.db.select({
        id: PostSchema.id,
        content: PostSchema.content,
        fileUrl: PostSchema.fileUrl,
        likeCount: count(LikeSchema.id),
        commentCount: count(CommentSchema.id),
        createdAt: PostSchema.createdAt,
        updatedAt: PostSchema.updatedAt,
        user: {
          username: UserSchema.username,
          profilePicture: UserSchema.profilePicture,
          name: UserSchema.name,
        },
      }).from(PostSchema)
        .where(eq(PostSchema.id, id))
        .limit(1)
        .leftJoin(LikeSchema, eq(LikeSchema.postId, PostSchema.id))
        .leftJoin(CommentSchema, eq(CommentSchema.postId, PostSchema.id))
        .leftJoin(UserSchema, eq(PostSchema.authorId, UserSchema.id))
        .groupBy(
          PostSchema.id,
          UserSchema.id,
          CommentSchema.postId)

      return data[0] as Post
    } catch (error) {
      Logger.error(error)
      throw new GraphQLError(error)
    }
  }

  // createPost
  async createPost(loggedUser: Author, body: CreatePostInput): Promise<Post | GraphQLError> {
    try {
      if (loggedUser.id !== body.authorId) {
        throw new GraphQLError('You are not authorized to perform this action')
      }
      const data = await this.drizzleProvider.db.insert(PostSchema).values({
        content: body.content ?? "",
        fileUrl: body.fileUrl,
        authorId: loggedUser.id,
        status: body.status
      }).returning()

      if (!data[0]) {
        throw new GraphQLError('Post not created')
      }

      return data[0] as Post
    } catch (error) {
      Logger.error(`Post not created:`, error)
      throw new GraphQLError(error)
    }
  }

  async createShort(data: shortUploadType): Promise<Post> {
    try {
      const _data = await this.drizzleProvider.db.insert(PostSchema).values({
        content: data.content ?? "",
        title: data.title ?? "",
        fileUrl: [{ shortVideoUrl: data.url, shortVideoThumbnail: data.thumbnailUrl }],
        authorId: data.authorId,
        status: "published",
        type: "short",
      }).returning();

      if (!_data[0]) {
        throw new GraphQLError('Post not created')
      };

      return _data[0];
    } catch (error) {
      Logger.error(`Post not created:`, error)
      throw new HttpException('Failed to create short', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  };
}
