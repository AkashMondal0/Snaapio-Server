import { InputType, Field } from '@nestjs/graphql';
import { NotificationType } from '../entities/notification.entity';

@InputType()
class AuthorInput {
  @Field(() => String)
  username: string;

  @Field(() => String, { nullable: true })
  profilePicture?: string;
}

@InputType()
class PostInput {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  fileUrl?: string;
}
@InputType()
export class CreateNotificationInput {
  @Field(() => String)
  type: NotificationType;

  @Field(() => String)
  authorId: string;

  @Field(() => String)
  recipientId: string;

  @Field(() => String, { nullable: true })
  postId: string;

  @Field(() => String, { nullable: true })
  commentId?: string;

  @Field(() => String, { nullable: true })
  storyId?: string;

  @Field(() => String, { nullable: true })
  reelId?: string;

  @Field(() => AuthorInput)
  author: AuthorInput;

  @Field(() => PostInput)
  post: PostInput;
}