import sharp from 'sharp';
import mime from 'mime-types';
import { desc, eq } from 'drizzle-orm';
import { supabase } from 'src/lib/Supabase';
import { ReqFile } from 'src/image/entities/image.entity';
import { generateRandomString } from 'src/lib/id-generate';
import { RedisProvider } from 'src/db/redis/redis.provider';
import { AiChatSessions } from 'src/db/drizzle/drizzle.schema';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { generationImageConfig, textGeneratingModel, imageGeneratingModel } from 'src/lib/genAi';
import { Author } from 'src/users/entities/author.entity';
import { AiChatSessions as AiChatSessionsType } from './entities/ai.entity';

@Injectable()
export class AiService {
  constructor(
    private readonly drizzleProvider: DrizzleProvider,
    private readonly redisProvider: RedisProvider,
  ) { }

  // gemini-2.0-flash
  async modelGemini2Flash(userId: string = "NA", id: string, prompt: string, file: ReqFile | undefined): Promise<any> {
    try {
      let result: any;
      let promptData: any = {
        image: null,
        text: prompt,
      }

      // Handle file upload if a file is provided
      if (file && file.originalname && file.buffer) {
        const allowedMimeTypes = ['image/jpeg', 'image/png'];
        const fileMimeType = mime.lookup(file.originalname);

        if (!fileMimeType || !allowedMimeTypes.includes(fileMimeType)) {
          throw new HttpException('Unsupported file type', HttpStatus.BAD_REQUEST);
        }
        const filePath = `ai_prompt/${userId}/${file.originalname}`;
        const compressedImage = await sharp(file.buffer).jpeg({ quality: 50 }).toBuffer();

        const { error, data } = await supabase.storage
          .from("snaapio-production")
          .upload(filePath, compressedImage, {
            cacheControl: "3600",
            contentType: "image/jpeg",
            upsert: false,
          });

        if (error) {
          if (error.message === "The resource already exists") {
            // Log the error if necessary
            // Logger.error(`Failed to upload ${filePath}: ${error.message}`);
            ; // Return existing file path if it already exists
            promptData.image = filePath; // Set the image path in promptData
          }
          // throw new Error(`Failed to upload file: ${error.message}`); // Throw error for other issues
        }

        if (data?.fullPath) {
          promptData.image = filePath; // Set the image path in promptData
        }

        // return filePath; // Return filePath for successful uploads
        const image = {
          inlineData: {
            data: Buffer.from(compressedImage).toString("base64"),
            mimeType: "image/png",
          },
        };
        result = await textGeneratingModel.generateContent([prompt, image]);
        return await result.response.text();
      } else {
        result = await textGeneratingModel.generateContent([prompt]);
        return await result.response.text();
      }
    } catch (error) {
      console.error("Error in modelGemini2Flash:", error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }


  async modelGemini2FlashImageGeneration(
    userId: string,
    id: string,
    prompt: string = "A futuristic cityscape at night"
  ): Promise<string | undefined> {
    try {
      const chatSession = imageGeneratingModel.startChat({
        generationConfig: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 8192,
          responseModalities: ["image", "text"],
          responseMimeType: "text/plain",
        },
        history: [],
      });

      const result = await chatSession.sendMessage(prompt);
      const candidates = result.response?.candidates || [];

      for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex++) {
        const parts = candidates[candidateIndex]?.content?.parts || [];

        for (let partIndex = 0; partIndex < parts.length; partIndex++) {
          const part = parts[partIndex];
          const inlineData = part?.inlineData;

          if (inlineData) {
            try {
              const fileExt = mime.extension(inlineData.mimeType);
              const filename = `${generateRandomString({})}_${candidateIndex}_${partIndex}.${fileExt}`;
              const filePath = `ai/${userId}/${filename}`;

              const fileBuffer = Buffer.from(inlineData.data, 'base64');
              const compressedImage = await sharp(fileBuffer)
                .jpeg({ quality: 60 }) // adjust compression as needed
                .toBuffer();

              const { error } = await supabase.storage
                .from("snaapio-production")
                .upload(filePath, compressedImage, {
                  cacheControl: "3600",
                  contentType: "image/jpeg",
                  upsert: false,
                });

              if (error) {
                if (error.message === "The resource already exists") {
                  return filePath;
                }
                console.error("Supabase upload error:", error);
                throw new Error(error.message);
              }

              return filePath;
            } catch (err) {
              console.error("Image processing/upload failed:", err);
            }
          }
        }
      }

      // If no image was returned, fallback to returning text (optional)
      return result.response?.text?.();
    } catch (error) {
      console.error("Image generation failed:", error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async createAiChatSession(userData: Author, data: AiChatSessionsType): Promise<any> {
    try {
      const res = await this.drizzleProvider.db
        .insert(AiChatSessions)
        .values({
          authorId: userData.id,
          shareLink: data.shareLink,
        })
        .returning();

      return res;
    } catch (error) {
      throw new HttpException('Internal Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}