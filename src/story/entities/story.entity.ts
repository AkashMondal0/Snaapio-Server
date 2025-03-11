import { ObjectType, Field } from '@nestjs/graphql';
import { Comment } from 'src/comment/entities/comment.entity';
import { AssetUrls, PostStatus } from 'src/post/entities/post.entity';
import { Author } from 'src/users/entities/author.entity';

@ObjectType()
export class Story {
  @Field(() => String, { nullable: true })
  id?: string | null;

  @Field(() => String, { nullable: true })
  content: string | null;

  @Field(() => [AssetUrls], { nullable: true })
  fileUrl?: AssetUrls[] | null;
  // 
  @Field(() => [String], { nullable: true })
  song?: any[];

  @Field(() => String, { nullable: true })
  createdAt?: Date | unknown;

  @Field(() => String, { nullable: true })
  updatedAt?: Date | unknown;

  @Field(() => String, { nullable: true })
  authorId?: string;

  @Field(() => Number, { nullable: true })
  viewCount?: number;

  @Field(() => String, { nullable: true })
  expiresAt?: Date;

  @Field(() => Author, { nullable: true })
  user?: Author | null | unknown;

  @Field(() => [Comment], { nullable: true })
  comments?: Comment[] | any[];

  @Field(() => [Author], { nullable: true })
  likes?: Author[] | any[];

  @Field(() => [String], { nullable: true })
  status?: PostStatus | string
}

@ObjectType()
export class Highlight {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  content: string | null;

  @Field(() => Number, { nullable: true })
  coverImageIndex?: number | 0;

  @Field(() => [Story], { nullable: true })
  stories?: Story[] | null;

  @Field(() => String, { nullable: true })
  createdAt?: Date | unknown;

  @Field(() => String, { nullable: true })
  updatedAt?: Date | unknown;

  @Field(() => String, { nullable: true })
  authorId?: string;

  @Field(() => Number, { nullable: true })
  viewCount?: number;

  @Field(() => Author, { nullable: true })
  user?: Author | null | unknown;

  @Field(() => [Comment], { nullable: true })
  comments?: Comment[] | any[];

  @Field(() => [Author], { nullable: true })
  likes?: Author[] | any[];

  @Field(() => [String], { nullable: true })
  status?: PostStatus | string
}