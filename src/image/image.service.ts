import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { supabase } from 'src/lib/Supabase';
import { ReqFile } from './entities/image.entity';
import { RedisProvider } from 'src/db/redis/redis.provider';
import sharp from 'sharp';
import { generateRandomString } from 'src/lib/id-generate';
import { AssetUrls } from 'src/post/entities/post.entity';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { imageVariants } from './imgVariants';
import { writeJsonToJobFolder } from 'src/lib/file-system';

@Injectable()
export class ImageService {
  constructor(
    // private readonly drizzleProvider: DrizzleProvider,
    private readonly redisProvider: RedisProvider,
    @InjectQueue('ImageProcessQueue') private readonly workQueue: Queue,
  ) { }
  expire: number = 7 * 24 * 60 * 60;

  // function depend -> compressedImages
  async processAndUploadImage(
    file: ReqFile,
    variant: { width: number; height: number; quality: number; aspectRatio: string; blur: boolean },
    userId: string
  ): Promise<any> {
    try {
      if (!file || !file.buffer) {
        Logger.error(`No buffer found for file: ${file?.originalname}`);
        return;
      }

      // Reconstruct proper Buffer
      const buffer = Buffer.from(file.buffer);

      let image = sharp(buffer).resize({
        width: variant.width,
        height: variant.height,
        fit: "cover",
      });

      if (variant.blur) {
        image = image.blur(14).jpeg({ quality: variant.quality });
      } else {
        image = image.jpeg({ quality: variant.quality });
      }

      const compressedImage = await image.toBuffer();
      const path = `/${variant.aspectRatio}/${file.originalname}`;

      const { error } = await supabase.storage
        .from("snaapio-production")
        .upload(path, compressedImage, {
          cacheControl: "3600",
          contentType: "image/jpeg",
          upsert: false,
        });

      if (error) {
        if (error?.message === "The resource already exists") {
          return { [variant.aspectRatio]: path };
        }
        Logger.warn(`Upload error for ${path}: ${error.message}`);
        return;
      }

      return { [variant.aspectRatio]: path };
    } catch (error) {
      Logger.error(`Processing error for ${file?.originalname ?? 'unknown file'}:`, error);
      return;
    }
  }

  async compressedImages(files: ReqFile[], userId: string): Promise<AssetUrls[]> {
    const imgArr: AssetUrls[] = [];
    const jobId = generateRandomString({});
    try {

      for (const file of files) {
        const id = generateRandomString({});

        writeJsonToJobFolder(jobId, file.originalname, file.buffer)
        const metadata = await sharp(file.buffer).metadata();

        const placeholderPaths = imageVariants.map(variant => {
          return { [variant.aspectRatio]: `/${variant.aspectRatio}/${file.originalname}` };
        });

        // Push immediate response structure
        imgArr.push({
          ...Object.assign({}, ...placeholderPaths),
          width: metadata.width,
          height: metadata.height,
          type: "image",
          id,
        });

      }
      // future 
      await this.workQueue.add('image-compress', { userId, jobId, imgArr },
        {
          removeOnComplete: true,  // okay
          removeOnFail: true,     // keep failed for debugging
        });

      return imgArr;
    } catch (error) {
      Logger.error("Image compression init failed:", error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  // new
  async uploadImage(files: ReqFile[], userId: string) {
    try {
      let imgUrls: string[] = [];
      const uploadPromises = files.map(async (file) => {
        const filePath = `${userId}/${file.originalname}`;
        const image = sharp(file.buffer).jpeg({ quality: 60 });
        const compressedImage = await image.toBuffer();

        const { error } = await supabase.storage
          .from("snaapio-production")
          .upload(filePath, compressedImage, {
            cacheControl: "3600",
            contentType: "image/jpeg",
            upsert: false,
          });

        if (error) {
          if (error?.message === "The resource already exists") {
            // Logger.error(`Failed to upload ${filePath}: ${error.message}`);
            return filePath;
          };
        }
        // Store in Redis (convert to Base64 to prevent binary storage issues)
        await this.redisProvider.client.set(`${filePath.replace("/", ":")}`, file.buffer.toString('base64'), "EX", this.expire); // ----------- set image to redis
        return filePath; // Return filePath for successful uploads
      });

      imgUrls = (await Promise.all(uploadPromises))

      return imgUrls;
    } catch (error) {
      Logger.error("Upload Processing error:", error);
      return null;
    }
  }

  async imageOptimization({ id, w, h, q, path, }: { id: string; w?: string; h?: string; q?: string; path: string; }) {
    try {
      if (!id || !path) {
        throw new HttpException('Invalid parameters: id and path are required', HttpStatus.BAD_REQUEST);
      }

      const createUrl = `${id}:${path}?w=${w || ''}&h=${h || ''}&q=${q || ''}`;

      // Check Redis Cache
      const cacheImage = await this.redisProvider.client.get(createUrl);  // ----------- get image to redis
      if (cacheImage) {
        // console.log("query cache hit");
        return Buffer.from(cacheImage, 'base64'); // Ensure correct conversion from Base64
      }
      let imageBuffer: any;
      // find original image cache
      const originalCacheImage = await this.redisProvider.client.get(`${id}:${path}`); // ----------- get image to redis

      if (!originalCacheImage) {
        // console.log("original hit");
        // Get the original image from Supabase
        const { data: originalImage, error: downloadError } = await supabase.storage
          .from('snaapio-production')
          .download(`${id}/${path}`);


        if (downloadError || !originalImage) {
          throw new HttpException(`Failed to download image: ${downloadError?.message || 'Unknown error'}`, HttpStatus.NOT_FOUND);
        }

        // Convert original image to Buffer
        imageBuffer = Buffer.from(await originalImage.arrayBuffer());
        await this.redisProvider.client.set(`${id}:${path}`, imageBuffer.toString('base64'), "EX", this.expire); // ----------- set original image to redis
      } else {
        // console.log("original cache hit");
        imageBuffer = Buffer.from(originalCacheImage, 'base64');
      }

      // Optimize the image using sharp
      const optimizedImage = await sharp(imageBuffer)
        .resize(w ? Number(w) : undefined, h ? Number(h) : undefined)
        .jpeg({ quality: q ? Number(q) : 70 })
        .toBuffer();

      // Store in Redis (convert to Base64 to prevent binary storage issues)
      await this.redisProvider.client.set(createUrl, optimizedImage.toString('base64'), "EX", this.expire); // ----------- set image to redis

      return optimizedImage;
    } catch (error) {
      Logger.error("Image processing failed:", error);
      throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
