import { ObjectType, Field } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { Message } from 'src/message/entities/message.entity';
import { Author } from 'src/users/entities/author.entity';

@ObjectType()
export class Conversation {
  @Field(() => String)
  id: string;

  @Field(() => [String], { nullable: true })
  members?: string[];

  @Field(() => GraphQLJSONObject, { nullable: true })
  membersPublicKey?: Record<string, string>;

  @Field(() => String, { nullable: true })
  authorId: string;

  @Field(() => [Message], { nullable: true })
  messages?: Message[] | any[]

  @Field(() => Author, { nullable: true })
  user?: Author | null

  @Field(() => Boolean, { nullable: true })
  isGroup: boolean | null;

  @Field(() => String, { nullable: true })
  lastMessageContent: string | null;

  @Field(() => Number, { nullable: true })
  totalUnreadMessagesCount?: number | null;

  @Field(() => Date, { nullable: true })
  lastMessageCreatedAt?: Date | null;

  @Field(() => Date, { nullable: true })
  createdAt?: Date | null;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;

  @Field(() => String, { nullable: true })
  groupName?: string | null;

  @Field(() => String, { nullable: true })
  groupImage?: string | null;

  @Field(() => String, { nullable: true })
  groupDescription?: string | null;
}