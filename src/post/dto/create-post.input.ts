import { InputType, Field } from '@nestjs/graphql';
import { PostStatus } from '../entities/post.entity';
@InputType()
export class InputAssets {
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
  type?: string | null;

  @Field(() => String, { nullable: true })
  id?: string | null;
}
// @InputType()
// export class InputAssets {
//   @Field(() => String, { nullable: true })
//   id?: string;

//   @Field(() => [_AssetUrls], { nullable: true })
//   urls?: _AssetUrls | [];

//   @Field(() => String, { nullable: true })
//   type?: 'photo' | 'video' | 'audio' | 'text';

//   @Field(() => String, { nullable: true })
//   caption?: string;
// }
@InputType()
export class CreatePostInput {

  @Field(() => String, { nullable: true })
  id?: string;

  @Field(() => String, { nullable: true })
  createdAt?: string;

  @Field(() => String)
  content: string;

  @Field(() => String)
  authorId: string;

  @Field(() => String, { nullable: true })
  title: string;

  @Field(() => String)
  status: PostStatus;
  //
  @Field(() => [InputAssets], { nullable: true })
  fileUrl?: InputAssets[];

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
}