
import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { count, eq, desc, exists, and, sql } from "drizzle-orm";
import { GraphQLError } from 'graphql';
import { CommentSchema, FriendshipSchema, LikeSchema, PostSchema, UserSchema } from 'src/db/drizzle/drizzle.schema';
import { CreatePostInput } from './dto/create-post.input';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
import { Author } from 'src/users/entities/author.entity';
import { Post, ReqFile } from './entities/post.entity';
import sharp from 'sharp';
import { supabase } from 'src/lib/Supabase';
import { generateRandomString } from 'src/lib/id-generate';

const imageVariants = [
  { aspectRatio: "1.1-sm", width: 100, height: 100, quality: 70 },
  { aspectRatio: "1:1", width: 500, height: 500, quality: 70 },
  { aspectRatio: "4:5", width: 1080, height: 1350, quality: 70 },
];

const imageBlurVariants = [
  { aspectRatio: "1:1", width: 100, height: 100, quality: 40 },
  { aspectRatio: "4:5", width: 300, height: 400, quality: 40 },
];

@Injectable()
export class PostService {
  constructor(private readonly drizzleProvider: DrizzleProvider) { }

  async feed(loggedUser: Author, limitAndOffset: GraphQLPageQuery): Promise<Post[]> {
    try {
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
        .where(eq(FriendshipSchema.followingUserId, PostSchema.authorId))
        .innerJoin(FriendshipSchema, eq(FriendshipSchema.authorUserId, loggedUser.id))
        .leftJoin(UserSchema, eq(PostSchema.authorId, UserSchema.id))
        .orderBy(desc(PostSchema.createdAt))
        .groupBy(
          PostSchema.id,
          UserSchema.id,
        )
        .limit(limitAndOffset.limit ?? 12)
        .offset(limitAndOffset.offset ?? 0)
      return data as Post[]
    } catch (error) {
      Logger.error(error)
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

  // compressed
  async processAndUploadImage(
    file: ReqFile,
    variant: { width: number; height: number, quality: number, aspectRatio: string },
    blur: boolean,
    userId: string
  ): Promise<string | null> {
    try {
      let image = sharp(file.buffer).resize({
        width: variant.width,
        height: variant.height,
        fit: "cover",
      });

      if (blur) {
        image = image.blur(16).jpeg({ quality: variant.quality });
      } else {
        image = image.jpeg({ quality: variant.quality });
      }

      const compressedImage = await image.toBuffer();
      const filePath = `${blur ? `${variant.aspectRatio}-blur` : variant.aspectRatio}/${userId}_${generateRandomString({})}`;

      const { error, data } = await supabase.storage
        .from("snaapio-production")
        .upload(filePath, compressedImage, {
          cacheControl: "3600",
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        Logger.error(`Failed to upload ${filePath}:`, error);
        return null;
      }

      return data?.path;
    } catch (error) {
      Logger.error(`Processing error for ${file.originalname}:`, error);
      return null;
    }
  }

  async compressedImages(files: ReqFile[], userId: string): Promise<string[]> {
    let imgArr: string[] = [];

    try {
      // Process normal images
      const uploadPromises = files.map(async (file) => {
        const urls = await Promise.all(
          imageVariants.map((variant) => this.processAndUploadImage(file, variant, false, userId))
        );
        imgArr.push(...urls.filter((url): url is string => url !== null)); // Filter out null values
      });

      // Process blurred images
      const uploadImageBlurPromises = files.map(async (file) => {
        const urls = await Promise.all(
          imageBlurVariants.map((variant) => this.processAndUploadImage(file, variant, true, userId))
        );
        imgArr.push(...urls.filter((url): url is string => url !== null)); // Filter out null values
      });

      // Wait for all uploads to finish
      await Promise.all([...uploadPromises, ...uploadImageBlurPromises]);

      return imgArr; // Return the collected image URLs
    } catch (error) {
      Logger.error("Image compression failed:", error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

}
