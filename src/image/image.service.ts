import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateImageDto } from './dto/create-image.dto';
import { UpdateImageDto } from './dto/update-image.dto';
import { supabase } from 'src/lib/Supabase';
import sharp from 'sharp';
import { ReqFile } from './entities/image.entity';

const imageVariants = [
  { aspectRatio: "1.1-sm", width: 100, height: 100, quality: 70 },
  { aspectRatio: "1:1", width: 500, height: 500, quality: 70 },
  { aspectRatio: "4:5", width: 1080, height: 1350, quality: 70 },
];

const imageBlurVariants = [
  { aspectRatio: "1:1", width: 100, height: 100, quality: 40 },
  { aspectRatio: "4:5", width: 300, height: 400, quality: 40 },
];

@Injectable()
export class ImageService {
  create(createImageDto: CreateImageDto) {
    return 'This action adds a new image';
  }

  findAll() {
    return `This action returns all image`;
  }

  findOne(id: number) {
    return `This action returns a #${id} image`;
  }

  update(id: number, updateImageDto: UpdateImageDto) {
    return `This action updates a #${id} image`;
  }

  remove(id: number) {
    return `This action removes a #${id} image`;
  }

    // compressed
    async processAndUploadImage(
      file: ReqFile,
      variant: { width: number; height: number, quality: number, aspectRatio: string },
      blur: boolean,
      userId: string
    ): Promise<string | null> {
      try {
        let image = sharp(file.buffer).resize({
          width: variant.width,
          height: variant.height,
          fit: "cover",
        });
  
        if (blur) {
          image = image.blur(16).jpeg({ quality: variant.quality });
        } else {
          image = image.jpeg({ quality: variant.quality });
        }
  
        const compressedImage = await image.toBuffer();
        const filePath = `${userId}_${file.originalname}`;
        const path = `${blur ? `${variant.aspectRatio}-blur` : variant.aspectRatio}/${filePath}`;
        const { error, data } = await supabase.storage
          .from("snaapio-production")
          .upload(path, compressedImage, {
            cacheControl: "3600",
            contentType: "image/jpeg",
            upsert: false,
          });
  
        if (error) {
          Logger.error(`Failed to upload ${filePath}:`, error);
          return null;
        }
  
        return filePath;
      } catch (error) {
        Logger.error(`Processing error for ${file.originalname}:`, error);
        return null;
      }
    }
  
    async compressedImages(files: ReqFile[], userId: string): Promise<string[]> {
      let imgArr: string[] = [];
  
      try {
        // Process normal images
        const uploadPromises = files.map(async (file) => {
          const urls = await Promise.all(
            imageVariants.map((variant) => this.processAndUploadImage(file, variant, false, userId))
          );
          imgArr.push(...urls.filter((url): url is string => url !== null)); // Filter out null values
        });
  
        // Process blurred images
        const uploadImageBlurPromises = files.map(async (file) => {
          const urls = await Promise.all(
            imageBlurVariants.map((variant) => this.processAndUploadImage(file, variant, true, userId))
          );
          imgArr.push(...urls.filter((url): url is string => url !== null)); // Filter out null values
        });
  
        // Wait for all uploads to finish
        await Promise.all([...uploadPromises, ...uploadImageBlurPromises]);
  
        return imgArr; // Return the collected image URLs
      } catch (error) {
        Logger.error("Image compression failed:", error);
        throw new HttpException('Internal Server Error', HttpStatus.INTERNAL_SERVER_ERROR);
      }
    }
  
    async imageOptimization({ id, w, h, q }: { id: string, w: string, h: string, q: string }) {
     
    }
}
