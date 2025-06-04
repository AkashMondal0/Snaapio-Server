import { Module } from '@nestjs/common';
import { PostService } from './post.service';
import { PostResolver } from './post.resolver';
import { PostController } from './post.controller';
import { DrizzleModule } from 'src/db/drizzle/drizzle.module';
import { UsersService } from 'src/users/users.service';
import { FriendshipService } from 'src/friendship/friendship.service';
import { RedisModule } from 'src/db/redis/redis.module';

@Module({
  imports: [DrizzleModule, RedisModule],
  providers: [PostResolver, PostService, UsersService, FriendshipService],
  controllers: [PostController],
  exports: [PostService],
})
export class PostModule { }
