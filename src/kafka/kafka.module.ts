// kafka/kafka.module.ts
import { Module } from '@nestjs/common';
import { KafkaConsumer } from './kafka.consumer';
import { KafkaService } from './kafka.producer';
import { RedisProvider } from 'src/db/redis/redis.provider';
import { NotificationService } from 'src/notification/notification.service';
import { EventGateway } from 'src/event/event.gateway';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { MessageBufferService } from './services/message-buffer.service';
import { MessageProcessorService } from './services/message-processor.service';
import { PostProcessorService } from './services/post-processor.service';
import { PostBufferService } from './services/post-buffer.service';

@Module({
  imports: [],
  providers: [
    KafkaService,
    KafkaConsumer,
    KafkaConsumer,
    MessageBufferService,
    MessageProcessorService,
    PostBufferService,
    PostProcessorService,
    DrizzleProvider,
    EventGateway,
    NotificationService,
    RedisProvider,
  ], // Register both producer and consumer
  exports: [KafkaService, KafkaConsumer], // Export to use in other modules
})
export class KafkaModule { }
