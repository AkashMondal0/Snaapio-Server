// kafka/message-buffer.service.ts
import { Injectable } from '@nestjs/common';
import { MessagesSchema } from 'src/db/drizzle/drizzle.schema';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { Message } from 'src/message/entities/message.entity';
import { SQL, and, arrayContains, inArray, not, sql } from 'drizzle-orm';
import { Author } from 'src/users/entities/author.entity';
import { CreateMessageInputSeen } from 'src/message/dto/create-message.input';

type SeenMessage = { data: CreateMessageInputSeen, author: Author };

@Injectable()
export class MessageBufferService {
  private readonly flushInterval = 1800; // 1.8s

  private buffer: Message[] = [];
  private bufferSeenMessage: SeenMessage[] = [];

  private isFlushing = false;
  private isSeenMessageFlushing = false;

  private readonly maxBufferSize = 100;
  private readonly maxBufferSizeSeenMessage = 100;

  constructor(private readonly drizzleProvider: DrizzleProvider) {
    setInterval(() => {
      this.flushMessage();
      this.flushSeenMessage();
    }, this.flushInterval);
  }

  async add(message: Message): Promise<void> {
    this.buffer.push(message);
    if (this.buffer.length >= this.maxBufferSize) {
      await this.flushMessage();
    }
  }

  async addSeenMessage(payload: SeenMessage): Promise<void> {
    this.bufferSeenMessage.push(payload);
    if (this.bufferSeenMessage.length >= this.maxBufferSizeSeenMessage) {
      await this.flushSeenMessage();
    }
  }

  async flushMessage(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) return;

    this.isFlushing = true;
    const batch = this.buffer.splice(0, this.buffer.length);

    const insertData = batch.map(msg => ({
      content: msg.encryptedMessage,
      e_key: msg.members_e_key,
      iv: msg.iv,
      conversationId: msg.conversationId,
      authorId: msg.authorId,
      fileUrl: msg.fileUrl ?? [],
      seenBy: [msg.authorId],
    }));

    try {
      await this.drizzleProvider.db.insert(MessagesSchema).values(insertData as any);
    } catch (err) {
      console.error('[Buffer] DB Insert Error:', err);
      this.buffer.unshift(...batch); // re-queue failed messages
    } finally {
      this.isFlushing = false;
    }
  }

  async flushSeenMessage(): Promise<void> {
    if (this.isSeenMessageFlushing || this.bufferSeenMessage.length === 0) return;

    this.isSeenMessageFlushing = true;
    const batch = this.bufferSeenMessage.splice(0, this.bufferSeenMessage.length);

    try {

      // Build an array of { id, userId } for each message/user combo
      const seenUpdates: { id: string, userId: string }[] = [];
      for (const { data: { conversationId: id }, author: { id: userId } } of batch) {
        seenUpdates.push({ id, userId: userId.toString() });
      }

      if (seenUpdates.length === 0) {
        return;
      }

      const sqlChunks: SQL[] = [];
      const ids: string[] = [];
      sqlChunks.push(sql`(case`);
      for (const item of seenUpdates) {
        sqlChunks.push(
          sql`when ${MessagesSchema.conversationId} = ${item.id} then array_append(${MessagesSchema.seenBy}, ${item.userId})`
        );
        ids.push(item.id);
      }
      sqlChunks.push(sql`end)`);
      const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));

      this.drizzleProvider.db
        .update(MessagesSchema)
        .set({ seenBy: finalSql })
        .where(
          and(
            inArray(MessagesSchema.conversationId, ids),
            ...seenUpdates.map(item =>
              not(arrayContains(MessagesSchema.seenBy, [item.userId]))
            )
          )
        );
    } catch (err) {
      console.error('[SeenMessage] DB Update Error:', err);
      this.bufferSeenMessage.unshift(...batch);
    } finally {
      this.isSeenMessageFlushing = false;
    }
  }

}