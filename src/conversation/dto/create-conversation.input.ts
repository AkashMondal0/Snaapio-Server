import { InputType, Field } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';

@InputType()
export class CreateConversationInput {
  @Field(() => String, { description: 'Example field (placeholder)', nullable: true })
  authorId?: string;

  @Field(() => [String], { description: 'Example field (placeholder)' })
  memberIds: string[];

  @Field(() => Boolean, { description: 'Example field (placeholder)' })
  isGroup: boolean;

  @Field(() => String, { description: 'Example field (placeholder)', nullable: true })
  groupName: string;

  @Field(() => String, { description: 'Example field (placeholder)', nullable: true })
  groupDescription: string;

  @Field(() => String, { description: 'Example field (placeholder)', nullable: true })
  groupImage: string;

  @Field(() => GraphQLJSONObject, { nullable: true })
  members_e_key?: Record<string, string> | any;
}
