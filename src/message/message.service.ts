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
import { decryptData, encryptData, encryptForParticipants } from 'src/lib/crypto/encrypt.decrypt';

@Injectable()
export class MessageService {
  constructor(
    private readonly drizzleProvider: DrizzleProvider,
    private readonly eventProvider: EventGateway
  ) { }
  async findAll(user: Author, graphQLPageQuery: GraphQLPageQuery): Promise<Message[]> {
    console.log(user)
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
      .offset(graphQLPageQuery.offset ?? 0)

    // decrypt content
    const privateKey = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAxMUo5lVd0561Q7KEhHhrhtB4zvGyz3KINUyW5pf5CNjC90au
ZhIWlhTI65DaeNPm7u30F1Xcm9rvBREA0+pP7tBJyiZNXjTYG+YfVs7y2N9KZddY
KYV9re/lN7RTBw5hDK7Ev+9NnVI/jJWFFtFdhcNlg0UT/t2M38uuWZVdiBzeSEIM
arPWozasKiEeEsRUeUXXrWJgbs3ZogbuPWUbsWUzgLVwBsDe4mMZM4OhLomFhh5T
iMGeRFZlKknRE2vfNbG2SJevc+aROH59Jpwdp9ZLG3mT2e7SiVwI1E9mF2FaPKSZ
JfE9jqVhCIaenzxECiAs17oodFt6LEga1GHpXwIDAQABAoIBAAdtke+wBUy5zwnx
MUN28Eg0knrtcNyX7EBm1cN6tTH6TNHc3zSHNkcQHc2WuEibZzpZzT8cRKm1iBRe
4fMeA0p2nnJ9I6qMwCO9ei1ivpQlSb+yc2eN3IK2baa+reu0RUGfT1oXhIyN0ExU
UKPd33PvPmPINcsHPgwsujYzh0ZeD6wQc2ao/j9Pz6ORzt4O2srNRnbv373O++Z4
u9oJFhzFvSJ9rC1L9mpgDustSFmoAFUrEdaIDpIQEcQDDeQ6LBNje/SsbMXMYuZj
hj53FL3xgIytKLRsITP/7IenUAo09JIXLVfOJ/CPemtOqEbITBue99WH+vyXyzUf
HZPO6WECgYEA4Tlb3Hnm7JaiR3sQHVXevnPXgwekIEn+pqY/wtdaKqQeJxZP9Uem
ZjUj5EbLIgf2GdAXItRdnVynDC0kApxSgVBnArUzHsXIWrn6Hg2joOngcP/DXvCl
/pqJDs2YJf7pNJAoB486dajMVRWHUS49W4XSeX7YnVVMX27lmX9osscCgYEA36hx
73aoZZFv3w6HVZooV/iXzAl1ikP77lToqY9WDMxPVhEdzgxIPNUjwVFHV7uLjsWc
gXUS+J1SppZqHFqIeARhU72SW+JbZgNWJ9ekwO4nrS5eG+nRqX6KExx2TI/8Gi7k
hHL2jG2rNXcg3zGb5JfaRw85psspnXBdd014/KkCgYEAguO5ziUOHjrgrpgHYnUQ
ETDzc1PSf21hT+pYLdzHqvZcC6085LgyLT3+0OCPlwR3csLrXzN6AETjVAE750R/
8mUOqJUz01NwP8HLaQHWMWMaK7GIEjnazl9y/aZgINzHHOQWT2ZevBhQP7ZWQMiV
ogXgrvkX3D/BNckWKCHSb+sCgYBrIMTKHXzVgY8jOVNLhlZypKkY2yMIwj2Gz/bN
WNGvuaD6qaIsEqf7M2A39ZWFiVh0X2TygUBAAyMWlg9nW1nomrh/otra1hZPS6PV
262Xl7s7cW00U4/QbsL2GnjzfTgU1ocwhdxgMRuDtXbyUVHJcY7k4H8NzFw3hB3Q
yjP8WQKBgQDVTT6g4YdwrEI5Bh7THw3BIFti2SdaKLCZ9QvIM+zfiUAaSXGu6qsW
sc9GAJor45wPeK34UCrqDkWLHDHqQjmn4MgO6/Z/TtriZreI3zLWLuLZzs2+n+U+
bEGTjuwijkFh+GV75CAoxRVnHPoxoa/4unN/8fr4e39SsMSygbuQTw==
-----END RSA PRIVATE KEY-----`
    // const nData = data.map((m, i) => {
    //   return {
    //     ...m, content: decryptData(
    //       data[i].content,
    //       data[i].e_key,
    //       data[i].iv,
    //       privateKey,
    //     )
    //   }
    // });

    return data.reverse();
  }

  async create(user: Author, createMessageInput: CreateMessageInput): Promise<Message> {
    const { authorId, content, members, membersPublicKey } = createMessageInput;
    const allParticipants = Array.from(new Set([...members, authorId]));

    const publicKeys = membersPublicKey.reduce<Record<string, string>>((acc, entry) => {
      acc[entry.authorId] = entry.publicKey;
      return acc;
    }, {});

    const encryptedMessage = encryptForParticipants(
      Buffer.from(content, 'utf-8'),
      publicKeys,
    );

    const data = await this.drizzleProvider.db.insert(MessagesSchema)
      .values({
        content: encryptedMessage.encryptedData,
        e_key: encryptedMessage.encryptedKeys,
        iv: encryptedMessage.iv,
        conversationId: createMessageInput.conversationId,
        authorId: createMessageInput.authorId,
        fileUrl: createMessageInput.fileUrl ?? [],
        seenBy: [user.id]
      })
      .returning();

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
