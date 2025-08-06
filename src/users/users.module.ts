import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DrizzleModule } from 'src/db/drizzle/drizzle.module';
import { UsersResolver } from './users.resolver';
import { RedisModule } from 'src/db/redis/redis.module';
import { KafkaModule } from 'src/kafka/kafka.module';

@Module({
  imports: [DrizzleModule, RedisModule, KafkaModule],
  providers: [UsersService, UsersResolver],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule { }
