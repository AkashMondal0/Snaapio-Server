import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { desc, eq } from 'drizzle-orm';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { AiChatSessions } from 'src/db/drizzle/drizzle.schema';
import { RedisProvider } from 'src/db/redis/redis.provider';
import { ReqFile } from 'src/image/entities/image.entity';
import { generationConfig, textGeneratingModel, imageGeneratingModel } from 'src/lib/genAi';

@Injectable()
export class AiService {
  constructor(
    private readonly drizzleProvider: DrizzleProvider,
    private readonly redisProvider: RedisProvider,
  ) { }

  async textToImageGenerate(userId: string, id: string, prompt: string, files: ReqFile | undefined): Promise<any> {
    const chatSession = imageGeneratingModel.startChat({
      generationConfig,
      history: [

      ],
    });
    const result = await chatSession.sendMessage(prompt);
    return result.response.text();
  }

  async textToTextGenerate(userId: string, id: string, prompt: string, files: ReqFile | undefined): Promise<any> {

    // get recent chat history from redis
    const chatSession = textGeneratingModel.startChat({
      generationConfig,
      history: [],
    });

    const result = await chatSession.sendMessage(prompt);
    return result.response.text();
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