import { Module } from '@nestjs/common';
import { CallSessionService } from './callSession.service';
import { CallSessionResolver } from './callSession.resolver';
import { CallSessionController } from './callSession.controller';
import { EventsModule } from 'src/event/event.module';
import { DrizzleModule } from 'src/db/drizzle/drizzle.module';
import { RedisModule } from 'src/db/redis/redis.module';

@Module({
  imports: [DrizzleModule, EventsModule, RedisModule],
  providers: [CallSessionResolver, CallSessionService],
  controllers: [CallSessionController],
})
export class CallSessionModule { }
