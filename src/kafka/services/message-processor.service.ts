// services/message-processor.service.ts
import { Injectable } from '@nestjs/common';
import { EventGateway } from 'src/event/event.gateway';
import { NotificationService } from 'src/notification/notification.service';
import { Message } from 'src/message/entities/message.entity';
import { CreateMessageInputSeen } from 'src/message/dto/create-message.input';
import { Author } from 'src/users/entities/author.entity';

@Injectable()
export class MessageProcessorService {
  constructor(
    private readonly eventGateway: EventGateway,
    private readonly notificationService: NotificationService,
  ) { }

  // socket service
  async messageProcess(data: Message): Promise<void> {
    const recipientId = data?.members?.find((id) => id !== data.authorId);
    if (!recipientId) return;

    const sockets = await this.eventGateway.findUserBySocketId([recipientId]);

    if (sockets && sockets.length > 0) {
      this.eventGateway.sendMessageToSocketUser(sockets, {
        ...data,
        content: data.content,
      });
    } else {
      await this.notificationService.ExpNotificationsSender(recipientId, {
        title: `${data.user?.name} - Message`,
        body: data.content,
        channelId: data.conversationId,
        data: { url: `snaapio://message/${data.conversationId}` },
      });
    }
  }


  async messageSeenProcess(payload: { data: CreateMessageInputSeen, author: Author }) {
    const recipientId = payload.data?.members?.filter((id) => id !== payload.data.authorId)[0];
    if (!recipientId) return;

    const sockets = await this.eventGateway.findUserBySocketId([recipientId]);

    if (sockets && sockets.length > 0) {
      this.eventGateway.sendSeenMessageToSocketUser(sockets, payload.data);
    }
  }
}
