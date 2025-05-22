import { ObjectType, Field ,PartialType} from '@nestjs/graphql';
@ObjectType()
export class Users {
  @Field(() => String)
  id: string;

  @Field(() => String)
  username: string;

  @Field(() => String)
  name: string;

  @Field(() => String)
  email: string;

  @Field(() => String, { nullable: true })
  profilePicture?: string;

  @Field(() => String, { nullable: true })
  bio?: string;

  @Field(() => [String])
  website: string[];

  @Field(() => String, { nullable: true })
  privateKey: string
  
  @Field(() => String, { nullable: true })
  publicKey: string
}

@ObjectType()
export class Account {
  @Field(() => String)
  id: string;

  @Field(() => Boolean)
  isVerified: boolean;

  @Field(() => Boolean)
  isPrivate: boolean;

  @Field(() => [String])
  roles: string[];

  @Field(() => String, { nullable: true })
  location?: string;

  @Field(() => Number, { nullable: true })
  phone?: number;

  @Field(() => String, { nullable: true })
  locale?: string;

  @Field(() => Number)
  timeFormat: number;

  @Field(() => Boolean)
  locked: boolean;

  @Field(() => Date, { nullable: true })
  accessTokenExpires?: Date;

  @Field(() => [String], { nullable: true })
  accessToken?: string[];

  @Field(() => [String], { nullable: true })
  refreshToken?: string[];

  @Field(() => Date)
  createdAt: Date;

  @Field(() => Date)
  updatedAt: Date;
}

@ObjectType()
export class UserSettings {
  @Field(() => String)
  id: string;

  @Field(() => String)
  theme: string;
}

@ObjectType()
export class UserPassword {
  @Field(() => String)
  id: string;

  @Field(() => String)
  password: string;

  @Field(() => String)
  hash: string;
}

@ObjectType()
export class Session {
  @Field(() => String)
  id: string;

  @Field(() => String)
  sessionToken: string;

  @Field(() => Date)
  expires: Date;
}