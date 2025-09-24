// kafka/kafka.service.ts
import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Admin, Kafka, Producer, logLevel } from 'kafkajs';

if (!process.env.KAFKA_BROKER) throw new Error("KAFKA_BROKER is not defined in .env file");
const kafkaBroker = process.env.KAFKA_BROKER;

@Injectable()
export class KafkaService implements OnModuleInit {
  private kafka: Kafka;
  private producer: Producer;
  private admin: Admin;

  async onModuleInit() {
    try {
      this.kafka = new Kafka({
        clientId: 'nestjs-app',
        brokers: [kafkaBroker],
        logLevel: logLevel.INFO,
      });

      this.producer = this.kafka.producer();
      this.admin = this.kafka.admin();

      await this.admin.connect();
      await this.producer.connect();

      await this.createTopic('message-topic');
      await this.createTopic('message-seen-topic');
      await this.createTopic('post-topic');
      await this.createTopic('post-like-topic');
      await this.createTopic('post-comment-topic');

      // Ensure Kafka has propagated topics
      await new Promise((res) => setTimeout(res, 3000));

      Logger.log('Kafka producer connected');
    } catch (error) {
      Logger.error(`Error connecting Kafka producer: ${error.message}`);
    }
  }

  async disconnect() {
    await this.producer?.disconnect();
    await this.admin?.disconnect();
  }

  async createTopic(topic: string) {
    try {
      const topics = await this.admin.listTopics();
      if (!topics.includes(topic)) {
        await this.admin.createTopics({
          topics: [{
            topic,
            numPartitions: 1,
            replicationFactor: 1,
          }],

        });
        Logger.log(`Created topic: ${topic}`);
      }
    } catch (error) {
      Logger.error(`Error creating topic ${topic}: ${error.message}`);
    }
  }

  async sendTopicMessage(topic: string, message: string) {
    try {
      await this.producer.send({
        topic,
        messages: [{ value: message }],
      });
    } catch (error) {
      Logger.error(`Error sending message to ${topic}: ${error.message}`);
    }
  }
}
