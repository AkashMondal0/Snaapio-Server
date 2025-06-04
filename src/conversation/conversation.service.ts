import { Injectable } from '@nestjs/common';
import { CreateConversationInput } from './dto/create-conversation.input';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { RedisProvider } from 'src/db/redis/redis.provider';
import { and, arrayContains, asc, desc, eq, or, sql } from 'drizzle-orm';
import { GraphQLError } from 'graphql';
import { ConversationSchema, MessagesSchema, UserSchema } from 'src/db/drizzle/drizzle.schema';
import { Conversation } from './entities/conversation.entity';
import { Author } from 'src/users/entities/author.entity';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
import { decryptForUser } from 'src/lib/crypto/encrypt.decrypt';
import { dataParser } from 'src/lib/dataParser';
@Injectable()
export class ConversationService {
  constructor(
    private readonly drizzleProvider: DrizzleProvider,
    private readonly redisProvider: RedisProvider
  ) { }

  async create(user: Author, createConversationInput: CreateConversationInput): Promise<Conversation | GraphQLError> {

    const {
      memberIds,
      isGroup = false,
      groupDescription = "Group",
      groupName = "Group",
      groupImage = "/user.jpg",
      members_e_key
    } = createConversationInput

    // create group
    if (isGroup && memberIds.length >= 2) {
      const data = await this.drizzleProvider.db.insert(ConversationSchema).values({
        authorId: user.id,
        members: [user.id, ...memberIds],
        members_e_key: members_e_key,
        isGroup,
        groupDescription,
        groupImage,
        groupName
      }).returning()

      if (!data[0]) {
        throw new GraphQLError("Invalid members create dm with only 2 members", {
          extensions: {}
        })
      }

      return data[0] as Conversation
    }

    if (memberIds.length < 1) {
      throw new GraphQLError("Invalid members create dm with only 2 members")
    }

    // find private
    const findConversationData = await this.drizzleProvider.db.select({ id: ConversationSchema.id })
      .from(ConversationSchema)
      .where(and(arrayContains(ConversationSchema.members, [user.id, ...memberIds]), eq(ConversationSchema.isGroup, false)))
      .limit(1)

    if (findConversationData[0]) {
      return findConversationData[0] as Conversation
    }
    // create private
    const data = await this.drizzleProvider.db.insert(ConversationSchema).values({
      authorId: user.id,
      members: [user.id, ...memberIds],
      members_e_key: members_e_key,
      userId: memberIds[0],
      isGroup,
    })
      .returning({ id: ConversationSchema.id })

    return data[0] as Conversation
  }

  async findAll(user: Author, graphQLPageQuery: GraphQLPageQuery): Promise<Conversation[] | GraphQLError> {
    if (!graphQLPageQuery?.privateKey) {
      throw new GraphQLError("privateKey not found", {
        extensions: { code: 'KEY_NOT_FOUND' }
      })
    };

    const convoKey = `chat:user:${user.id}:convos`;
    let convos = await this.redisProvider.client.get(convoKey);
    if (convos) {
      return dataParser(convos);
    }

    const data = await this.drizzleProvider.db.select({
      id: ConversationSchema.id,
      authorId: ConversationSchema.authorId,
      members: ConversationSchema.members,
      membersPublicKey: ConversationSchema.members_e_key,
      isGroup: ConversationSchema.isGroup,
      groupDescription: ConversationSchema.groupDescription,
      groupImage: ConversationSchema.groupImage,
      groupName: ConversationSchema.groupName,
      updatedAt: ConversationSchema.createdAt,
      messages: ConversationSchema.messages,
      // find user
      user: {
        id: UserSchema.id,
        username: UserSchema.username,
        email: UserSchema.email,
        profilePicture: UserSchema.profilePicture,
        name: UserSchema.name,
        // publicKey:UserSchema.publicKey
      },
      // find last message
      lastMessageContent: MessagesSchema.content,
      lastMessage: MessagesSchema,
      lastMessageCreatedAt: MessagesSchema.createdAt,
      totalUnreadMessagesCount: sql`(SELECT COUNT(*) 
        FROM ${MessagesSchema}
        WHERE ${MessagesSchema.conversationId} = ${ConversationSchema.id}
        AND NOT ${MessagesSchema.seenBy} @> ARRAY[${user.id}]::text[])`
    })
      .from(ConversationSchema)
      .where(arrayContains(ConversationSchema.members, [user.id]))
      .leftJoin(UserSchema, eq(UserSchema.id,
        sql`CASE 
          WHEN ${ConversationSchema.userId} = ${user.id} THEN ${ConversationSchema.authorId}
          WHEN ${ConversationSchema.authorId} = ${user.id} THEN ${ConversationSchema.userId}
          ELSE ${ConversationSchema.userId}
        END`
      ))
      .leftJoin(MessagesSchema, sql`
        ${MessagesSchema.conversationId} = ${ConversationSchema.id}
        AND ${MessagesSchema.createdAt} = (
          SELECT MAX(${MessagesSchema.createdAt})
          FROM ${MessagesSchema}
          WHERE ${MessagesSchema.conversationId} = ${ConversationSchema.id}
        )`)
      .orderBy(desc(MessagesSchema.createdAt))
      .limit(graphQLPageQuery.limit ?? 12)
      .offset(graphQLPageQuery.offset ?? 0);

    const newData = data.map((con) => {
      return {
        ...con,
        lastMessageContent: con.lastMessage ? decryptForUser(
          con.lastMessage.content,
          con.lastMessage.e_key[user.id], // encryptedKey
          con.lastMessage.iv,
          graphQLPageQuery.privateKey,
        ).toString() : "..."
      }
    })

    await this.redisProvider.client.set(convoKey, JSON.stringify(newData), 'EX', 10);
    return newData as Conversation[]
  }

  async findOne(user: Author, graphQLPageQuery: GraphQLPageQuery): Promise<Conversation | GraphQLError> {

    const convoKey = `chat:user:${user.id}:convo:${graphQLPageQuery.id}`;
    let convos = await this.redisProvider.client.get(convoKey);
    if (convos) {
      return dataParser(convos);
    }

    const data = await this.drizzleProvider.db.select({
      id: ConversationSchema.id,
      authorId: ConversationSchema.authorId,
      members: ConversationSchema.members,
      membersPublicKey: ConversationSchema.members_e_key,
      isGroup: ConversationSchema.isGroup,
      groupDescription: ConversationSchema.groupDescription,
      groupImage: ConversationSchema.groupImage,
      groupName: ConversationSchema.groupName,
      updatedAt: ConversationSchema.updatedAt,
      lastMessageContent: ConversationSchema.lastMessageContent,
      messages: ConversationSchema.messages,
      user: {
        id: UserSchema.id,
        username: UserSchema.username,
        email: UserSchema.email,
        profilePicture: UserSchema.profilePicture,
        name: UserSchema.name,
        // publicKey: UserSchema.publicKey
      }
    })
      .from(ConversationSchema)
      .where(and(
        eq(ConversationSchema.id, graphQLPageQuery.id),
        arrayContains(ConversationSchema.members, [user.id])
      ))
      .leftJoin(UserSchema, eq(UserSchema.id,
        sql`CASE 
          WHEN ${ConversationSchema.userId} = ${user.id} THEN ${ConversationSchema.authorId}
          WHEN ${ConversationSchema.authorId} = ${user.id} THEN ${ConversationSchema.userId}
          ELSE ${ConversationSchema.userId}
        END`
      ))
      .limit(1)

    if (!data[0]) {
      throw new GraphQLError("Conversation not found")
    }

    await this.redisProvider.client.set(convoKey, JSON.stringify(data[0]), 'EX', 10);

    return data[0];
  }
}
