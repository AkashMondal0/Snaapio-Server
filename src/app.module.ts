import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DrizzleModule } from './db/drizzle/drizzle.module';
import configuration from './configs/configuration';
import { RedisModule } from './db/redis/redis.module';
import { PostModule } from './post/post.module';
import { CommentModule } from './comment/comment.module';
import { LikeModule } from './like/like.module';
import { ExploreModule } from './explore/explore.module';
import { ConversationModule } from './conversation/conversation.module';
import { MessageModule } from './message/message.module';
import { FriendshipModule } from './friendship/friendship.module';
import { EventsModule } from './event/event.module';
import { NotificationModule } from './notification/notification.module';
import { StoryModule } from './story/story.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { CallSessionModule } from './video-call/callSession.module';
import { ImageModule } from './image/image.module';
import { AiModule } from './ai/ai.module';
import { PaymentModule } from './payment/payment.module';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { FileModule } from './file/file.module';
import { QueueModule } from './queue/queue.module';
// import { KafkaModule } from './kafka/kafka.module';

@Module({
  imports: [
    DrizzleModule,
    RedisModule,
    EventsModule,
    GraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: 'schema.gql',
      context: (req: any, res: any) => ({ req, res }),
      introspection: process.env.NODE_ENV !== 'production',
      playground: false,
      plugins: process.env.NODE_ENV === 'production' ? [] : [ApolloServerPluginLandingPageLocalDefault()],
    }),
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: ['.env', '.env.development'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 10 }]),
    PrometheusModule.register({
      path: '/v1/metrics', // Endpoint for Prometheus to scrape metrics
      defaultMetrics: {
        enabled: true, // Enable default system metrics
      },
    }),
    QueueModule,
    AuthModule,
    UsersModule,
    PostModule,
    CommentModule,
    LikeModule,
    ExploreModule,
    ConversationModule,
    MessageModule,
    FriendshipModule,
    NotificationModule,
    StoryModule,
    CallSessionModule,
    ImageModule,
    AiModule,
    PaymentModule,
    FileModule,
    // KafkaModule
  ],
  controllers: [AppController],
  providers: [AppService],
})


export class AppModule { }