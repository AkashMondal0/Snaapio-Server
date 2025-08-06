// services/message-processor.service.ts
import { Injectable } from '@nestjs/common';
import { EventGateway } from 'src/event/event.gateway';
import { NotificationService } from 'src/notification/notification.service';
import { Message } from 'src/message/entities/message.entity';
import { CreateMessageInputSeen } from 'src/message/dto/create-message.input';
import { Author } from 'src/users/entities/author.entity';
import { Post } from 'src/post/entities/post.entity';
import { CreatePostInput } from 'src/post/dto/create-post.input';

@Injectable()
export class PostProcessorService {
  constructor(
    private readonly eventGateway: EventGateway,
    private readonly notificationService: NotificationService,
  ) { }

  async postProcess(data: CreatePostInput): Promise<void> {
  
  }

}
