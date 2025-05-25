import { Field, InputType, PartialType } from '@nestjs/graphql';

@InputType()
export class GraphQLPageQuery {

  @Field(() => String, { nullable: true })
  id: string;

  @Field(() => String, { nullable: true })
  privateKey: string;

  @Field(() => Number, { nullable: true })
  offset?: number;

  @Field(() => Number, { nullable: true })
  limit?: number;
}

@InputType()
export class GraphQLLocationQuery extends PartialType(GraphQLPageQuery) {
  @Field(() => Number)
  latitude: number;

  @Field(() => Number)
  longitude: number;

  @Field(() => Number)
  distance: number;
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