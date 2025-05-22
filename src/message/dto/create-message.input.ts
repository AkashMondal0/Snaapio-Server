import { InputType, Field } from '@nestjs/graphql';
import { GraphQLJSONObject } from 'graphql-type-json';
import { InputAssets } from 'src/post/dto/create-post.input';

@InputType()
export class CreateMessageInput {
  @Field(() => String, { description: 'Example field (placeholder)' })
  content: string;

  @Field(() => String, { description: 'Example field (placeholder)' })
  authorId: string;

  @Field(() => String, { description: 'Example field (placeholder)' })
  conversationId: string;

  @Field(() => [InputAssets], { description: 'Example field (placeholder)', nullable: true })
  fileUrl: InputAssets[];

  @Field(() => [String], { description: 'Example field (placeholder)' })
  members: string[];

  @Field(() => GraphQLJSONObject, { description: 'Example field (placeholder)' })
  membersPublicKey:  Record<string, string>;
}

@InputType()
export class MembersPublicKey {
  @Field(() => String)
  authorId: string;

  @Field(() => String)
  publicKey: string;
}

@InputType()
export class CreateMessageInputSeen {

  @Field(() => String)
  authorId: string;

  @Field(() => String)
  conversationId: string;

  @Field(() => [String])
  members: string[];
}
