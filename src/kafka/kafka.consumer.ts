// kafka/kafka.consumer.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { Kafka, Consumer, logLevel, EachMessagePayload } from 'kafkajs';
import { Message } from 'src/message/entities/message.entity';
import { MessageProcessorService } from './services/message-processor.service';
import { MessageBufferService } from './services/message-buffer.service';
import { CreateMessageInputSeen } from 'src/message/dto/create-message.input';
import { Author } from 'src/users/entities/author.entity';
import { PostProcessorService } from './services/post-processor.service';
import { PostBufferService } from './services/post-buffer.service';
import { CreatePostInput } from 'src/post/dto/create-post.input';

if (!process.env.KAFKA_BROKER) throw new Error("KAFKA_BROKER is not defined in .env file");
const kafkaBroker = process.env.KAFKA_BROKER;
@Injectable()
export class KafkaConsumer implements OnModuleInit {
  private kafka: Kafka;
  private consumer: Consumer;

  constructor(
    private readonly messageProcessorService: MessageProcessorService,
    private readonly messageBufferService: MessageBufferService,
    private readonly postProcessorService: PostProcessorService,
    private readonly postBufferService: PostBufferService,
  ) {
    this.kafka = new Kafka({
      clientId: 'nestjs-app',
      brokers: [kafkaBroker],
      logLevel: logLevel.ERROR,
    });
  }

  async onModuleInit() {
    this.consumer = this.kafka.consumer({ groupId: 'nestjs-consumer-group' });

    await this.consumer.connect();

    // List of all topics to handle
    const topics = ['message-topic', 'message-seen-topic', 'post-topic', 'post-like-topic', 'post-comment-topic'];

    for (const topic of topics) {
      await this.consumer.subscribe({ topic, fromBeginning: false });
    }

    await this.consumer.run({
      eachMessage: async (payload: EachMessagePayload) => {
        try {
          if (!payload.message.value) return;

          const parsedValue = JSON.parse(payload.message.value.toString());

          // Route to correct handler based on topic
          await this.dispatchByTopic(payload.topic, parsedValue);
        } catch (err) {
          console.error(`[Kafka] Error in consumer: ${err.message}`);
        }
      },
    });

    console.log('[Kafka] Consumer started.');
  }

  private async dispatchByTopic(topic: string, payload: any): Promise<void> {
    switch (topic) {
      case 'message-topic':
        await this.handleMessageTopic(payload);
        break;

      case 'message-seen-topic':
        await this.handleMessageSeenTopic(payload);
        break;

      case 'post-topic':
        await this.handlePostTopic(payload);
        break;

      case 'post-like-topic':
        await this.handlePostLikeTopic(payload);
        break;

      case 'post-comment-topic':
        await this.handlePostCommentTopic(payload);
        break;

      default:
        console.warn(`[Kafka] Unhandled topic: ${topic}`);
    }
  }

  private async handleMessageTopic(data: Message): Promise<void> {
    await this.messageProcessorService.messageProcess(data);      // Real-time or push
    await this.messageBufferService.add(data);      // Add to DB buffer
  }

  private async handleMessageSeenTopic(payload: { data: CreateMessageInputSeen, author: Author }): Promise<void> {
    await this.messageProcessorService.messageSeenProcess(payload);      // Real-time or push
    await this.messageBufferService.addSeenMessage(payload);
  }

  private async handlePostTopic(data: CreatePostInput): Promise<void> {
    // this.postProcessorService.postProcess(data)
    this.postBufferService.add(data)
  }

  private async handlePostLikeTopic(data: any): Promise<void> {

  }

  private async handlePostCommentTopic(data: any): Promise<void> {

  }

  async disconnect() {
    await this.consumer.disconnect();
    await this.messageBufferService.flushMessage();
    console.log('[Kafka] Consumer disconnected.');
  }
}
