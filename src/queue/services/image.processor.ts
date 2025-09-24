import { Job } from 'bullmq';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { FileService } from 'src/file/file.service';
import { ReqFile } from 'src/image/entities/image.entity';
import { imageVariants } from 'src/image/imgVariants';
import { ImageService } from 'src/image/image.service';
import { AssetUrls } from 'src/post/entities/post.entity';
import { deleteJobFolder, readImagesFromJobFolder } from 'src/lib/file-system';

@Processor('ImageProcessQueue')
export class ImageProcessor extends WorkerHost {
  constructor(
    // private readonly fileService: FileService,
    private readonly imageService: ImageService,

  ) {
    super();
  }
  async process(job: Job<any>): Promise<any> {
    switch (job.name) {
      case 'image-compress':
        return this.handleImageCompress(job.data);
      default:
        console.warn(`Unknown job type: ${job.name}`);
        break;
    }
  };

  private async handleImageCompress(jobData: {
    userId: string,
    jobId: string,
    imgArr: AssetUrls[]
  }) {
    const { userId, jobId, imgArr } = jobData;
    try {
      const filesInFolder = await readImagesFromJobFolder(jobId); // Must be async function

      const data: ReqFile[] = [];

      for (const img of imgArr) {
        const match = filesInFolder.find(f => img.original?.includes(f.filename));
        if (match) {
          data.push({
            ...match,
            buffer: match.buffer,
            originalname: match.filename,
          });
        }
      }

      // ✅ Optional: Do actual image processing
      for (const file of data) {
        for (const variant of imageVariants) {
          await this.imageService.processAndUploadImage(file, variant, userId);
        }
      }

    } catch (error) {
      console.error('Error processing job:', error);
    } finally {
      // delete folder
      deleteJobFolder(jobId);
    }
  }

}
