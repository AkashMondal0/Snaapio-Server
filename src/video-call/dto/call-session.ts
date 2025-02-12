import { ObjectType, Field, InputType } from '@nestjs/graphql';

// session user
@ObjectType()
export class CallSessionUser {
  @Field(() => String)
  username: string;

  @Field(() => String)
  email: string | null | any

  @Field(() => String)
  id: string;

  @Field(() => String)
  name: string;

  @Field(() => String, { nullable: true })
  profilePicture: string | null
}

// participants
@ObjectType()
export class Participants {
  @Field(() => CallSessionUser, { nullable: false })
  user: CallSessionUser;

  @Field(() => Boolean, { nullable: false, defaultValue: false })
  riseHand: boolean;

  @Field(() => Boolean, { nullable: false })
  micOn: boolean;

  @Field(() => Boolean, { nullable: false })
  videoOn: boolean;
};

// CallSession
@ObjectType()
export class CallSession {
  @Field(() => String)
  sessionId: string;

  @Field(() => [Participants])
  participants: Participants[];

  @Field(() => String, { nullable: true })
  createdAt?: String;

  @Field(() => Boolean, { defaultValue: false })
  privateSession?: boolean;
}

@InputType()
export class ParticipantsInput {
  @Field(() => String, { nullable: true })
  sessionId?: string;

  @Field(() => Boolean, { defaultValue: false })
  privateSession?: boolean;

  @Field(() => Boolean, { nullable: false, defaultValue: false })
  riseHand: boolean;

  @Field(() => Boolean, { nullable: false })
  micOn: boolean;

  @Field(() => Boolean, { nullable: false })
  videoOn: boolean;
}