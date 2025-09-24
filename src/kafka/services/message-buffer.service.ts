// kafka/message-buffer.service.ts
import { Injectable } from '@nestjs/common';
import { MessagesSchema } from 'src/db/drizzle/drizzle.schema';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { Message } from 'src/message/entities/message.entity';
import { SQL, and, arrayContains, eq, inArray, not, or, sql } from 'drizzle-orm';
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
      id: msg.id,
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
      // Extract unique { conversationId, userId }
      const seenUpdates = new Map<string, Set<string>>();
      for (const { data: { conversationId }, author: { id: userId } } of batch) {
        const uid = String(userId);
        if (!seenUpdates.has(conversationId)) {
          seenUpdates.set(conversationId, new Set());
        }
        seenUpdates.get(conversationId)!.add(uid);
      }

      // Prepare SQL CASE WHEN expression
      const sqlChunks: SQL[] = [sql`(CASE`];
      const ids: string[] = [];

      for (const [convId, userIds] of seenUpdates.entries()) {
        // One CASE per conversation ID
        for (const uid of userIds) {
          sqlChunks.push(
            sql`WHEN ${MessagesSchema.conversationId} = ${convId} 
               THEN array_append(${MessagesSchema.seenBy}, ${uid})`
          );
        }
        ids.push(convId);
      }

      sqlChunks.push(sql`END)`);
      const finalSql: SQL = sql.join(sqlChunks, sql.raw(' '));

      // Execute single UPDATE for all conversations
      await this.drizzleProvider.db
        .update(MessagesSchema)
        .set({ seenBy: finalSql })
        .where(
          and(
            inArray(MessagesSchema.conversationId, ids),
            // Exclude rows where userId already exists in seenBy
            or(
              ...[...seenUpdates.entries()].map(([convId, userIds]) =>
                and(
                  eq(MessagesSchema.conversationId, convId),
                  ...[...userIds].map(uid =>
                    not(arrayContains(MessagesSchema.seenBy, [uid]))
                  )
                )
              )
            )
          )
        )
        .execute();

    } catch (err) {
      console.error("[SeenMessage] DB Update Error:", err);
      this.bufferSeenMessage.unshift(...batch);
    } finally {
      this.isSeenMessageFlushing = false;
    }
  }

}