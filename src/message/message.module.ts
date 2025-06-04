import { Module } from '@nestjs/common';
import { MessageService } from './message.service';
import { MessageResolver } from './message.resolver';
import { MessageController } from './message.controller';
import { RedisModule } from 'src/db/redis/redis.module';
import { DrizzleModule } from 'src/db/drizzle/drizzle.module';
import { EventsModule } from 'src/event/event.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [RedisModule, DrizzleModule, EventsModule, NotificationModule],
  providers: [MessageResolver, MessageService, EventsModule],
  controllers: [MessageController],
})
export class MessageModule { }
