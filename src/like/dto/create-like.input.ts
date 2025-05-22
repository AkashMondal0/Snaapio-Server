import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateLikeInput {
  @Field(() => String)
  id: string;
  @Field(() => Boolean)
  like: boolean;
  @Field(() => String)
  recipientId: string;
  @Field(() => String)
  postUrl: string;
}
