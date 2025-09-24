import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promisify } from 'util';
import { promises as fs } from 'node:fs';
import { exec } from 'node:child_process';
import * as path from 'node:path';
import { UploadData, VideoOption } from './types';
import { generateRandomString } from 'src/lib/id-generate';
import { supabase } from 'src/lib/Supabase';
import { PostService } from 'src/post/post.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
const execAsync = promisify(exec);
@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private hostBasePath: string;

  constructor(
    private configService: ConfigService,
    @InjectQueue('VideoTranscodeQueue') private readonly  workQueue: Queue,
    private readonly postService: PostService
  ) {
    this.hostBasePath = this.configService.get<string>('HOST_BASE_PATH') ?? '';
  };

  async uploadFile(data: UploadData): Promise<any> {
    const {
      file: videoFile,
      start = '0',
      end = '40',
      muted = 'false',
      resize = 'scale=-2:480',
      ratio = '9/16'
    } = data;

    if (!videoFile) {
      throw new HttpException('Video required', HttpStatus.INTERNAL_SERVER_ERROR);
    };

    const jobId = generateRandomString({});
    const jobDir = path.resolve(__dirname, '../../../jobs', jobId);
    try {
      const outputDir = path.join(jobDir, 'output');
      const videoFilePath = path.join(jobDir, 'input.mp4');
      await fs.mkdir(jobDir, { recursive: true });
      await fs.writeFile(videoFilePath, videoFile.buffer as any);
      await fs.mkdir(outputDir, { recursive: true });

      return await this.addJobToQueue(
        {
          jobDir,
          jobId,
          url: `/shorts_480p/${jobId}/playlist.m3u8`,
          thumbnailUrl: `/shorts_480p/${jobId}/thumbnail.jpg`,
          authorId: data.user.id,
          caption: data.caption,
          title: data.title
        },
        {
          start,
          end,
          muted,
          resize,
          ratio
        }
      );
    } catch (error) {
      this.cleanupJob(jobDir, jobId, `job_${jobId}`);
      this.logger.error(`Error initializing job`, error);
      throw new HttpException('Failed to initialize job', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async runDockerCompose(jobDir: string, jobId: string, videoOption: VideoOption): Promise<void> {
    const containerName = `job_${jobId}`;
    const absoluteJobDir = `${this.hostBasePath}/jobs/${jobId}`.replace(/\\/g, '/');
    const { start, end, muted } = videoOption;
    const duration = parseInt(end) - parseInt(start);
    const muteFlag = muted === 'true' ? '-an' : '';

    try {
      await execAsync(
        `docker run --rm --name ${containerName} ` +
        `-v ${absoluteJobDir}:/app:rw -v ${absoluteJobDir}/output:/output -w /app ` +
        `jrottenberg/ffmpeg:latest ` +
        `-ss ${start} -t ${duration} -i input.mp4 ` +
        `${muteFlag} -c:v libx264 -preset fast -crf 23 ` +
        `-f hls -hls_time 4 -hls_playlist_type vod ` +
        `-hls_segment_filename /output/segment_%03d.ts /output/playlist.m3u8`
      );

      // Generate thumbnail
      await execAsync(
        `docker run --rm --name ${containerName}_thumb ` +
        `-v ${absoluteJobDir}:/app:rw -v ${absoluteJobDir}/output:/output -w /app ` +
        `jrottenberg/ffmpeg:latest ` +
        `-i input.mp4 -ss 00:00:03.000 -vframes 1 ` +
        `-vf "scale=480:-1" -q:v 5 -compression_level 7 ` +
        `/output/thumbnail.jpg`
      );

      await this.uploadToSupabase(jobDir, jobId);
    } catch (error) {
      this.logger.error(`Error in job ${jobId}:\n`, error.stderr || error.message);
      throw new HttpException(`Error in job ${jobId}:\n`, HttpStatus.INTERNAL_SERVER_ERROR);
    } finally {
      await this.cleanupJob(jobDir, jobId, containerName);
    }
  };

  private async cleanupJob(jobDir: string, jobId: string, containerName: string): Promise<void> {
    try {
      await execAsync(`docker rm -f ${containerName}`).catch(() => { });
      await fs.rm(jobDir, { recursive: true, force: true });
    } catch (error) {
      this.logger.error(`Error cleaning up job ${jobId}:`, error.stderr || error.message);
    };
  };

  private async uploadToSupabase(jobDir: string, jobId: string): Promise<void> {
    const outputDir = path.join(jobDir, 'output');

    try {
      const files = await fs.readdir(outputDir);

      const uploadPromises = files.map(async (file) => {
        const filePath = path.join(outputDir, file);
        const fileBuffer = await fs.readFile(filePath);

        const { error } = await supabase.storage
          .from("snaapio-production")
          .upload(`shorts_480p/${jobId}/${file}`, fileBuffer, {
            cacheControl: "3600",
            contentType: file.includes('.jpg') ? 'image/jpeg' : 'video/mp4',
            upsert: true,
          });

        if (error) {
          this.logger.error(`❌ Error uploading ${file}:`, error.message);
        }
      });

      await Promise.all(uploadPromises);
    } catch (error) {
      this.logger.error('Error uploading files to Supabase:', error.message);
      throw new HttpException(`Error uploading files to Supabase:`, HttpStatus.INTERNAL_SERVER_ERROR);
    };
  };

  private async addJobToQueue({
    jobDir, jobId, url, authorId, caption, title, thumbnailUrl
  }: {
    jobDir: string, jobId: string, url: string, thumbnailUrl: string,
    authorId: string, caption: string, title: string
  }, videoOption: VideoOption) {
    try {
      await this.workQueue.add('video-transcode', { jobDir, jobId, url, videoOption },
        {
          jobId: jobId,
          removeOnComplete: true,  // okay
          removeOnFail: true,     // keep failed for debugging
        });

      const res = await this.postService.createShort({
        content: caption ?? "",
        title: title ?? "",
        url: url,
        authorId: authorId,
        thumbnailUrl: thumbnailUrl
      });

      return {
        ...res,
        state: "initial",
        url: url,
        id: jobId
      };
    } catch (error) {
      this.logger.error(`Error addJobToQueue job ${jobId}:`, error);
      throw new HttpException('Failed to addJobToQueue job', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getJobStatus(jobId: string): Promise<any> {
    try {
      const job = await this.workQueue.getJob(jobId);
      return {
        state: await job?.getState(),
        url: await job?.data?.url,
        id: job?.id
      };
    }
    catch (e) {
      throw new HttpException('Failed to find job', HttpStatus.INTERNAL_SERVER_ERROR);
    };
  };
};