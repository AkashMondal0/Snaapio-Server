import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class GraphQLPageQuery {

  @Field(() => String, { nullable: true })
  id: string;

  @Field(() => Number, { nullable: true })
  offset?: number;

  @Field(() => Number, { nullable: true })
  limit?: number;
}

@InputType()
export class TypingStatusInput {

  @Field(() => Boolean, { defaultValue: false })
  typing?: boolean;

  @Field(() => String)
  authorId?: string;

  @Field(() => [String])
  members?: string[];

  @Field(() => String)
  conversationId?: string;

  @Field(() => Boolean, { defaultValue: false })
  isGroup?: boolean;
}