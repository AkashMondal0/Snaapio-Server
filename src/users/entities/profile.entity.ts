import { ObjectType, Field, PartialType } from '@nestjs/graphql';
import { Author } from './author.entity';
import { Friendship } from 'src/friendship/entities/friendship.entity';


@ObjectType()
export class Profile extends PartialType(Author) {

  @Field(() => Number, { nullable: true })
  postCount?: number;

  @Field(() => Number, { nullable: true })
  followerCount?: number | unknown;

  @Field(() => Number, { nullable: true })
  followingCount?: number | unknown;

  @Field(() => Friendship, { nullable: true })
  friendship?: Friendship | unknown;

  @Field(() => [Author], { nullable: true })
  top_followers?: Author[] | null;

  @Field(() => Boolean, { nullable: true })
  isPrivate?: boolean | null;

  @Field(() => Boolean, { nullable: true })
  isVerified?: boolean | null;
}