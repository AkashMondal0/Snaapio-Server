import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { WorkProcessor } from './work.processor';
import { PostModule } from 'src/post/post.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    PostModule,
    BullModule.registerQueue({ name: 'work_queue' }),
  ],
  controllers: [FileController],
  providers: [FileService, WorkProcessor],
  exports: [FileService]
})
export class FileModule { }
