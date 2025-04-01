import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class AiChatMessages {
	@Field(() => String)
	id: string;

	@Field(() => String)
	sessionId: string;

	@Field(() => String)
	authorId: string;

	@Field(() => String)
	role: "assistant" | "system" | "user";

	@Field(() => String)
	message: string;

	@Field(() => String, { nullable: true })
	prompt?: string | null;

	@Field(() => [String], { nullable: true })
	fileUrls?: string[] | null

	@Field(() => Date, { nullable: true })
	createdAt?: Date | null;
}

@ObjectType()
export class AiChatSessions {
	@Field(() => String)
	id: string;

	@Field(() => String)
	authorId: string;

	@Field(() => Date, { nullable: true })
	createdAt?: Date | null;

	@Field(() => Boolean, { nullable: true })
	shareLink?: boolean | null;

	@Field(() => [AiChatMessages], { nullable: true })
	messages?: AiChatMessages[] | any[]
}