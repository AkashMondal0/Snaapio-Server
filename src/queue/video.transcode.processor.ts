import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { FileService } from 'src/file/file.service';
import { VideoTranscodeQueuePayload } from 'src/file/types';

@Processor('VideoTranscodeQueue')
export class VideoTranscodeProcessor extends WorkerHost {
  constructor(private readonly fileService: FileService) {
    super();
  }
  async process(job: Job<any>): Promise<any> {
    switch (job.name) {
      case 'video-transcode':
        return this.handleVideoTranscode(job.data);
      default:
        console.warn(`Unknown job type: ${job.name}`);
        break;
    }
  };

  private async handleVideoTranscode(jobData: VideoTranscodeQueuePayload) {
    try {
      const { jobDir, jobId, videoOption } = jobData;
      // console.log(jobDir, jobId, videoOption);
      await this.fileService.runDockerCompose(jobDir, jobId, videoOption);
    } catch (error) {
      console.error('Error processing job:', error);
    }
  }
}
