import { Injectable } from '@nestjs/common';
import { CreateMessageInput, CreateMessageInputSeen } from './dto/create-message.input';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { Message } from './entities/message.entity';
import { ConversationSchema, MessagesSchema, UserSchema } from 'src/db/drizzle/drizzle.schema';
import { eq, desc, and, sql, arrayContains, not } from 'drizzle-orm';
import { Author } from 'src/users/entities/author.entity';
import { GraphQLPageQuery, TypingStatusInput } from 'src/lib/types/graphql.global.entity';
import { EventGateway } from 'src/event/event.gateway';
import { event_name } from 'src/configs/connection.name';

@Injectable()
export class MessageService {
  constructor(
    private readonly drizzleProvider: DrizzleProvider,
    private readonly eventProvider: EventGateway
  ) { }
  async findAll(user: Author, graphQLPageQuery: GraphQLPageQuery): Promise<Message[]> {
    const data = await this.drizzleProvider.db.select({
      id: MessagesSchema.id,
      conversationId: MessagesSchema.conversationId,
      authorId: MessagesSchema.authorId,
      content: MessagesSchema.content,
      fileUrl: MessagesSchema.fileUrl,
      deleted: MessagesSchema.deleted,
      seenBy: MessagesSchema.seenBy,
      createdAt: MessagesSchema.createdAt,
      updatedAt: MessagesSchema.updatedAt,
      user: {
        id: UserSchema.id,
        username: UserSchema.username,
        email: UserSchema.email,
        profilePicture: UserSchema.profilePicture,
        name: UserSchema.name,
      }
    })
      .from(MessagesSchema)
      .where(and(
        eq(MessagesSchema.conversationId, graphQLPageQuery.id),
        arrayContains(ConversationSchema.members, [user.id])
      ))
      .leftJoin(ConversationSchema, eq(MessagesSchema.conversationId, ConversationSchema.id))
      .leftJoin(UserSchema, eq(MessagesSchema.authorId, UserSchema.id))
      .orderBy(desc(MessagesSchema.createdAt))
      .limit(graphQLPageQuery.limit ?? 16)
      .offset(graphQLPageQuery.offset ?? 0)

    return data?.reverse()
  }

  async create(user: Author, createMessageInput: CreateMessageInput): Promise<Message> {
    const data = await this.drizzleProvider.db.insert(MessagesSchema)
      .values({
        content: createMessageInput.content,
        conversationId: createMessageInput.conversationId,
        authorId: createMessageInput.authorId,
        fileUrl: createMessageInput.fileUrl ?? [],
        seenBy: [user.id]
      })
      .returning()
    this.eventProvider.publishMessage(event_name.conversation.message, { ...data[0], members: createMessageInput.members })
    return data[0]
  }

  async seenMessages(user: Author, conversationId: CreateMessageInputSeen): Promise<boolean> {
    await this.drizzleProvider.db.update(MessagesSchema)
      .set({
        seenBy: sql`array_append(${MessagesSchema.seenBy}, ${user.id})`
      })
      .where(and(
        eq(MessagesSchema.conversationId, conversationId.conversationId),
        not(arrayContains(MessagesSchema.seenBy, [user.id]))
      ))
    this.eventProvider.publishMessage(event_name.conversation.seen, { ...conversationId })
    return true
  }

  async typingStatus(typingStatus: TypingStatusInput): Promise<string> {
    this.eventProvider.publishMessage(event_name.conversation.typing, typingStatus);
    return "sending";
  }

}
