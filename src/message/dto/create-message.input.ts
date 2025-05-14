import { InputType, Field } from '@nestjs/graphql';
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

  @Field(() => [MembersPublicKey], { description: 'Example field (placeholder)' })
  membersPublicKey: MembersPublicKey[];
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
