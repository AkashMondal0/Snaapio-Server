import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { AiChatMessages, AiChatSessions } from 'src/db/drizzle/drizzle.schema';
import { RedisProvider } from 'src/db/redis/redis.provider';
import { ReqFile } from 'src/image/entities/image.entity';
import { generationConfig, textGeneratingModel, imageGeneratingModel } from 'src/lib/genAi';

@Injectable()
export class AiService {
  constructor(
    private readonly drizzleProvider: DrizzleProvider,
    private readonly redisProvider: RedisProvider,
  ) { }

  async textToImageGenerate(userId: string, id: string, promt: string, files: ReqFile | undefined): Promise<any> {
    const chatSession = imageGeneratingModel.startChat({
      generationConfig,
      history: [

      ],
    });
    const result = await chatSession.sendMessage(promt);
    return result;
  }

  async textToTextGenerate(userId: string, id: string, promt: string, files: ReqFile | undefined): Promise<any> {

    // get recent chat history from redis
    const chatSession = textGeneratingModel.startChat({
      generationConfig,
      history: [
        { role: 'user', parts: `console.log("akash") print it as it is` },
      ],
    });
    const result = await chatSession.sendMessage(promt);
    // console.log(chatSession)
    return result.response.text();
  }

  async startChat(userId: string, sessionId: string, prompt: string) {
    const generationConfig = { /* AI model config */ };

    // Get recent chat history (from cache or DB)
    const history = await this.getRecentHistory(sessionId, userId, 10, 0);

    // Format history for AI model
    const formattedHistory = history.map((msg) => ({
      role: msg.role,
      parts: msg.message,
    }));

    // Start chat session
    const chatSession = textGeneratingModel.startChat({
      generationConfig,
      history: formattedHistory,
    });

    // Send user message
    const result = await chatSession.sendMessage(prompt);

    // Save messages asynchronously
    // await this.cacheChatHistory(sessionId, userId, prompt);
    await this.saveMessage(sessionId, userId, "assistant", result.response.text());

    return result.response.text();
  }

  async getRecentHistory(sessionId: string, userId: string, limit: number = 10, offset: number = 0) {
    // First, try to get cached history
    const cachedHistory = await this.getCachedChatHistory(sessionId, userId);
    if (cachedHistory) return cachedHistory;

    // If not in cache, fetch from DB
    const history = await this.drizzleProvider.db
      .select()
      .from(AiChatSessions)
      .where(eq(AiChatMessages.sessionId, sessionId))
      .orderBy(desc(AiChatMessages.createdAt))
      .limit(limit)
      .offset(offset)

    // Cache the result
    await this.cacheChatHistory(sessionId, userId, history);

    return history;
  }

  async getCachedChatHistory(sessionId: string, userId: string) {
    const messages = await this.redisProvider.client.hget(`ai_session:${userId}`, sessionId);
    if (!messages) return null;
    return JSON.stringify(messages);
  }

  async cacheChatHistory(sessionId: string, userId: string, role: string, data: any) {
    await this.redisProvider.client.set(`ai_session:${userId}`, sessionId, JSON.stringify(data));
  }

  async saveMessage(sessionId: string, userId: string, role: any, data: any) {
    if (!sessionId || !userId || !role || !data) {
      throw new HttpException('Empty Input Not Allow', HttpStatus.BAD_REQUEST);
    };

    const res = await this.drizzleProvider.db.insert(AiChatMessages).values({
      authorId: userId,
      message: "",
      promt: "",
      fileUrls: [],
      role: role,
      sessionId: sessionId,
    }).returning();

    return res
  }

  async createAiChatSession(sessionId: string) {
    try {
      const res = await this.drizzleProvider.db
        .insert(AiChatSessions)
        .values({
          authorId: sessionId,
          shareLink: false,
        })
        .returning();

      return res;
    } catch (error) {
      throw new HttpException('Internal Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}