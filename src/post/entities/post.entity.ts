import { ObjectType, Field } from '@nestjs/graphql';
import { Comment } from 'src/comment/entities/comment.entity';
import { Author } from 'src/users/entities/author.entity';

export enum PostStatus {
  Draft = 'draft',
  Published = 'published',
  Archived = 'archived',
}
@ObjectType()
export class AssetUrls {
  @Field(() => String, { nullable: true })
  blur_square?: string | null;

  @Field(() => String, { nullable: true })
  square?: string | null;

  @Field(() => String, { nullable: true })
  square_sm?: string | null;

  @Field(() => String, { nullable: true })
  blur_original?: string | null;

  @Field(() => String, { nullable: true })
  original?: string | null;

  @Field(() => String, { nullable: true })
  original_sm?: string | null;

  @Field(() => Number, { nullable: true })
  width?: number | null;

  @Field(() => Number, { nullable: true })
  height?: number | null;

  @Field(() => String, { defaultValue: "image", nullable: true })
  type?: string | null | 'photo' | 'video' | 'audio' | 'text';

  @Field(() => String, { nullable: true })
  id?: string | null;

  @Field(() => String, { nullable: true })
  caption?: string | null;

  @Field(() => String, { nullable: true })
  shortVideoUrl?: string | null;
}

@ObjectType()
export class Post {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  content: string | null;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => [AssetUrls], { nullable: true, defaultValue: [] })
  fileUrl?: AssetUrls[] | null;
  // 
  @Field(() => [String], { nullable: true })
  song?: any[];

  @Field(() => [String], { nullable: true })
  tags: any[];

  @Field(() => [String], { nullable: true })
  locations: any[];

  @Field(() => String, { nullable: true })
  country?: any;

  @Field(() => String, { nullable: true })
  city?: any;

  @Field(() => Date, { nullable: true })
  createdAt?: Date | unknown;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | unknown;

  @Field(() => String, { nullable: true })
  authorId?: string;

  @Field(() => String, { nullable: true })
  username?: string;

  @Field(() => Number, { nullable: true })
  commentCount?: number;

  @Field(() => Number, { nullable: true })
  likeCount?: number;

  @Field(() => Boolean, { nullable: true })
  is_Liked?: boolean | unknown | null;

  @Field(() => Author, { nullable: true })
  user?: Author | null | unknown;

  @Field(() => [Comment], { nullable: true })
  comments?: Comment[] | any[];

  @Field(() => [Author], { nullable: true })
  likes?: Author[] | any[];

  @Field(() => [Author], { nullable: true })
  top_Like?: Author[] | null;

  @Field(() => [String], { nullable: true })
  status?: PostStatus | string
}