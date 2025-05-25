import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { PostModule } from 'src/post/post.module';
import { VideoTranscodeQueue } from 'src/queue/queue.channels';

@Module({
  imports: [
    PostModule,
    VideoTranscodeQueue
  ],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService]
})
export class FileModule { }
