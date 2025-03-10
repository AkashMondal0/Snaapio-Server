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
  low?: string | null;

  @Field(() => String, { nullable: true })
  medium?: string | null;

  @Field(() => String, { nullable: true })
  high?: string | null;

  @Field(() => String, { nullable: true })
  blur?: string | null;

  @Field(() => String, { nullable: true })
  thumbnail?: string | null;
}
@ObjectType()
export class Assets {
  @Field(() => String, { nullable: true })
  id?: string;

  @Field(() => AssetUrls, { nullable: true })
  urls?: AssetUrls;

  @Field(() => String, { nullable: true })
  type?: 'photo' | 'video' | 'audio' | 'text';

  @Field(() => String, { nullable: true })
  caption?: string;
}
@ObjectType()
export class Post {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  content: string | null;

  @Field(() => String, { nullable: true })
  title?: string | null;

  @Field(() => [Assets], { nullable: true })
  fileUrl?: Assets[] | null;
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