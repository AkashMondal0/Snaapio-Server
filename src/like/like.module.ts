import { Module } from '@nestjs/common';
import { LikeService } from './like.service';
import { LikeResolver } from './like.resolver';
import { LikeController } from './like.controller';
import { DrizzleModule } from 'src/db/drizzle/drizzle.module';
import { NotificationModule } from 'src/notification/notification.module';
import { RedisModule } from 'src/db/redis/redis.module';

@Module({
  imports: [DrizzleModule, NotificationModule, RedisModule],
  providers: [LikeResolver, LikeService],
  controllers: [LikeController],
})
export class LikeModule { }
