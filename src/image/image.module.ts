import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { RedisModule } from 'src/db/redis/redis.module';
import { ImageProcessQueue } from 'src/queue/queue.channels';

@Module({
  imports: [RedisModule, ImageProcessQueue],
  controllers: [ImageController],
  providers: [ImageService],
  exports: [ImageService]
})
export class ImageModule { }
