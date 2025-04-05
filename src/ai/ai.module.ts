import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from './ai.controller';
import { DrizzleModule } from 'src/db/drizzle/drizzle.module';
import { RedisModule } from 'src/db/redis/redis.module';

@Module({
  imports: [DrizzleModule, RedisModule],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule { }
