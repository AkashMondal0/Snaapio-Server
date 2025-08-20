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
import { decryptForUser, encryptForParticipants } from 'src/lib/crypto/encrypt.decrypt';
import { RedisProvider } from 'src/db/redis/redis.provider';
import { GraphQLError } from 'graphql';
import { NotificationService } from 'src/notification/notification.service';
// import { KafkaService } from 'src/kafka/kafka.producer';
import { generateRandomString } from 'src/lib/id-generate';
import { dataParser } from 'src/lib/dataParser';
import { MessageProcessorService } from 'src/kafka/services/message-processor.service';
import { MessageBufferService } from 'src/kafka/services/message-buffer.service';

@Injectable()
export class MessageService {
  constructor(
    private readonly drizzleProvider: DrizzleProvider,
    private readonly eventProvider: EventGateway,
    private readonly notificationService: NotificationService,
    private readonly redisProvider: RedisProvider,
    private readonly messageProcessorService: MessageProcessorService,
    private readonly messageBufferService: MessageBufferService,
    // private readonly kafkaProvider: KafkaService
  ) { }
  async findAll(user: Author, graphQLPageQuery: GraphQLPageQuery): Promise<Message[] | GraphQLError> {
    if (!graphQLPageQuery?.privateKey) {
      throw new GraphQLError("privateKey not found", {
        extensions: { code: 'KEY_NOT_FOUND' }
      })
    };

    const cacheKey = `messages:${graphQLPageQuery.id}:${user.id}:${graphQLPageQuery.limit}:${graphQLPageQuery.offset}`;
    let messages = await this.redisProvider.client.get(cacheKey) as any;

    if (messages) {
      return dataParser(messages);
    }

    const data = await this.drizzleProvider.db.select({
      id: MessagesSchema.id,
      conversationId: MessagesSchema.conversationId,
      authorId: MessagesSchema.authorId,
      content: MessagesSchema.content,
      e_key: MessagesSchema.e_key,
      iv: MessagesSchema.iv,
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
      .offset(graphQLPageQuery.offset ?? 0);

    const nData = data.map((m, i) => {
      return {
        ...m,
        content: decryptForUser(
          m.content,
          m.e_key[user.id], // encryptedKey
          m.iv,
          graphQLPageQuery.privateKey,
        ).toString()
      }
    });

    // await this.redisProvider.client.set(cacheKey, JSON.stringify(nData.reverse()), 'EX', 60 * 60 * 24 * 7); // 7 days
    return nData.reverse();
  }

  async create(user: Author, createMessageInput: CreateMessageInput): Promise<Message> {
    const encryptedMessage = encryptForParticipants(
      Buffer.from(createMessageInput.content, 'utf-8'),
      createMessageInput.membersPublicKey,
    );

    const _message: Message = {
      content: createMessageInput.content,
      encryptedMessage: encryptedMessage.encryptedData,
      members_e_key: encryptedMessage.encryptedKeys as any,
      iv: encryptedMessage.iv,
      conversationId: createMessageInput.conversationId,
      authorId: createMessageInput.authorId,
      fileUrl: createMessageInput.fileUrl ?? [],
      seenBy: [user.id],
      id: generateRandomString({ length: 16, type: "lowernumeric" }),
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        profilePicture: user.profilePicture,
        name: user.name,
      },
      deleted: false,
      members: createMessageInput.members,
    }

    // Save message to the database
    // await this.kafkaProvider.sendTopicMessage('message-topic', JSON.stringify(_message));
    await this.messageBufferService.add(_message);
    await this.messageProcessorService.messageProcess(_message);
    return _message;
  }

  async seenMessages(user: Author, payload: CreateMessageInputSeen): Promise<boolean> {
    const data = {
      author: user,
      data: payload
    }
    // await this.kafkaProvider.sendTopicMessage('message-seen-topic', JSON.stringify({ author: user, data: payload }));
    await this.messageProcessorService.messageSeenProcess(data);      // Real-time or push
    await this.messageBufferService.addSeenMessage(data);
    return true;
  }

  async typingStatus(typingStatus: TypingStatusInput): Promise<string> {
    this.eventProvider.publishMessage(event_name.conversation.typing, typingStatus);
    return "sending";
  }

}
