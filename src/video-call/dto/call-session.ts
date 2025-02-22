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

// type: "audio-call" | "video-call"

@InputType()
export class RequestForCallInput {
  @Field(() => String, { nullable: false, defaultValue: "audio-call" })
  type: string;

  @Field(() => String, { nullable: false })
  requestUserId: string;

  @Field(() => Boolean, { nullable: false, defaultValue: false })
  isVideo: boolean;

  @Field(() => String, { nullable: false, defaultValue: "calling" })
  status: string;
}

@InputType()
export class IncomingCallAnswerInput {

  @Field(() => Boolean, { nullable: false, defaultValue: false })
  acceptCall: boolean;

  @Field(() => String, { nullable: false })
  requestSenderUserId: string;
}


@ObjectType()
export class RequestForCall {

  @Field(() => Boolean, { nullable: false, defaultValue: false })
  data: boolean;

  @Field(() => String, { nullable: false, defaultValue: "Request Call Error" })
  message: string;
}