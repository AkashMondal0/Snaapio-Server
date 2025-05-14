import { ObjectType, Field } from '@nestjs/graphql';
import { AssetUrls } from 'src/post/entities/post.entity';
import { Author } from 'src/users/entities/author.entity';

export type EncryptedKeys = {
  [key: string]: string;
};

@ObjectType()
export class KeyValue {
  @Field(() => String, { nullable: true })
  key?: string;

  @Field(() => String, { nullable: true })
  value?: string;
}

@ObjectType()
export class Message {
  @Field(() => String)
  id: string;

  @Field(() => String)
  conversationId: string;

  @Field(() => String, { nullable: true })
  authorId: string | null;

  @Field(() => String, { nullable: true })
  content: string;

  @Field(() => [KeyValue], { nullable: true })
  e_key?: KeyValue[] | null | any;

  @Field(() => String, { nullable: true })
  iv?: string;

  @Field(() => Author, { nullable: true })
  user?: Author | null;

  @Field(() => [AssetUrls], { nullable: true })
  fileUrl?: AssetUrls[] | null;

  @Field(() => Boolean, { nullable: true })
  deleted?: boolean | null;

  @Field(() => [String], { nullable: true })
  seenBy?: string[] | null;

  @Field(() => Date, { nullable: true })
  createdAt?: Date | null | unknown;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null | unknown;

  @Field(() => [String], { nullable: true })
  members?: string[]
}