// kafka/message-buffer.service.ts
import { Injectable } from '@nestjs/common';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
// import { SQL, and, arrayContains, inArray, not, sql } from 'drizzle-orm';
// import { Author } from 'src/users/entities/author.entity';
// import { Post } from 'src/post/entities/post.entity';
import { PostSchema } from 'src/db/drizzle/drizzle.schema';
import { CreatePostInput } from 'src/post/dto/create-post.input';

@Injectable()
export class PostBufferService {
  private readonly flushInterval = 1800; // 1.8s
  private buffer: CreatePostInput[] = [];
  private isFlushing = false;
  private readonly maxBufferSize = 100;

  constructor(private readonly drizzleProvider: DrizzleProvider) {
    setInterval(() => {
      this.flushPost();
    }, this.flushInterval);
  }

  async add(Post: CreatePostInput): Promise<void> {
    this.buffer.push(Post);
    if (this.buffer.length >= this.maxBufferSize) {
      await this.flushPost();
    }
  }

  async flushPost(): Promise<void> {
    if (this.isFlushing || this.buffer.length === 0) return;

    this.isFlushing = true;
    const batch = this.buffer.splice(0, this.buffer.length);

    const insertData = batch.map((msg: CreatePostInput) => ({
      content: msg.content ?? "",
      fileUrl: msg.fileUrl,
      authorId: msg.authorId,
      status: msg.status
    }));

    try {
      await this.drizzleProvider.db.insert(PostSchema).values(insertData);
      // console.log("kafka post upload")
    } catch (err) {
      console.error('[Buffer] DB Insert Error:', err);
      this.buffer.unshift(...batch); // re-queue failed messages
    } finally {
      this.isFlushing = false;
    }
  }

}