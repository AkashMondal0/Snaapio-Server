import { Module } from '@nestjs/common';
import { ImageService } from './image.service';
import { ImageController } from './image.controller';
import { RedisModule } from 'src/db/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [ImageController],
  providers: [ImageService],
})
export class ImageModule { }
