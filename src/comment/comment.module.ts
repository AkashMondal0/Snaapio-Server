import { Module } from '@nestjs/common';
import { CommentService } from './comment.service';
import { CommentResolver } from './comment.resolver';
import { CommentController } from './comment.controller';
import { DrizzleModule } from 'src/db/drizzle/drizzle.module';
import { NotificationModule } from 'src/notification/notification.module';

@Module({
  imports: [DrizzleModule, NotificationModule],
  providers: [CommentResolver, CommentService],
  controllers: [CommentController],
})
export class CommentModule { }
