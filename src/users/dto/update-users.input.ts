import { InputType, Field } from '@nestjs/graphql';
import { InputAssets} from 'src/post/dto/create-post.input';

@InputType()
export class UpdateUsersInput {
  @Field(() => String, { nullable: true })
  username: string;

  @Field(() => String, { nullable: true })
  email: string;

  @Field(() => String, { nullable: true })
  name: string;

  @Field(() => String, { nullable: true }) 
  profilePicture: string | null

  @Field(() => String, { nullable: true })
  bio: string | null

  @Field(() => String, { nullable: true })
  website: string[] | any[]

  @Field(() => [InputAssets], { nullable: true, defaultValue: [] })
  fileUrl?: InputAssets[] | null;
}
