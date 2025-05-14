import { ObjectType, Field } from '@nestjs/graphql';
import { AssetUrls } from 'src/post/entities/post.entity';

@ObjectType()
export class Author {
  @Field(() => String)
  username: string;

  @Field(() => String, { nullable: true })
  email?: string | null | any

  @Field(() => String, { nullable: true })
  id: string;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true })
  profilePicture: string | null

  @Field(() => Boolean, { nullable: true })
  followed_by?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  following?: boolean | null;

  @Field(() => String, { nullable: true })
  bio?: string | null;

  @Field(() => [String], { nullable: true })
  website?: string[] | any[];

  @Field(() => String, { nullable: true })
  lastStatusUpdate?: string | null;

  @Field(() => [AssetUrls], { nullable: true, defaultValue: [] })
  fileUrl?: AssetUrls[] | null;

  @Field(() => String, { nullable: true })
  privateKey?: string
  
  @Field(() => String, { nullable: true })
  publicKey?: string
}
