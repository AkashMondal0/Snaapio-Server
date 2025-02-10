import { Injectable, Logger, OnModuleInit, UseGuards } from '@nestjs/common';
import { event_name } from 'src/configs/connection.name';
import {
    MessageBody,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsJwtGuard } from 'src/auth/guard/Ws-Jwt-auth.guard';
import { Notification } from 'src/notification/entities/notification.entity';
import Redis from 'ioredis';

if (!process.env.REDIS_URL) throw new Error("REDIS_URL is not defined in .env file");
const url = process.env.REDIS_URL;
@WebSocketGateway({
    cors: {
        origin: "*", // allow all origins
        credentials: true,
    },
    namespace: "chat"
})
@Injectable()
export class EventGateway implements OnModuleInit {
    @WebSocketServer()
    server: Server;
    client: Redis;
    sub: Redis;

    async onModuleInit() {
        this.client = new Redis(url);
        this.sub = new Redis(url);

        try {
            const redisSubscriber = this.sub;
            await redisSubscriber.subscribe(
                event_name.conversation.message,
                event_name.conversation.seen,
                event_name.conversation.typing,
                event_name.notification.post,
                "test"
            );

            redisSubscriber.on("message", (channel, message) => {
                const data = JSON.parse(message);
                if (channel === "test") {
                    console.log("From Server : Redis SUB :v1");
                    this.server.emit(channel, data);
                    return;
                }
                this.server.to(data.members).emit(channel, data);
            });

            Logger.log('Redis subscriber initialized successfully');
        } catch (error) {
            Logger.error('Redis subscriber initialization failed', error);
        }
    }

    extractUserIdAndName(client: Socket): { userId: string, username: string } | null {
        const { userId, username } = client.handshake.query as { userId: string, username: string };
        return userId && username ? { userId, username } : null;
    }

    async findUserBySocketId(userIds?: string[]): Promise<string[] | null> {
        if (!userIds?.length) return null;
        const ids = await Promise.all(userIds.map(userId => this.client.hget("skylight:clients", userId)));
        return ids.filter(Boolean) as string[];
    }

    publishMessage(channel: string, data: any) {
        this.client.publish(channel, JSON.stringify(data));
    }

    async handleConnection(client: Socket) {
        const userId = this.extractUserIdAndName(client)?.userId;
        if (userId) await this.client.hset("skylight:clients", userId, client.id);
    }

    async handleDisconnect(client: Socket) {
        const userId = this.extractUserIdAndName(client)?.userId;
        if (userId) await this.client.hdel("skylight:clients", userId);
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.conversation.message)
    async IncomingClientMessage(@MessageBody() data: any) {
        const ids = await this.findUserBySocketId(data.members);
        if (ids) this.publishMessage(event_name.conversation.message, { ...data, members: ids });
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.conversation.seen)
    async IncomingClientMessageSeen(@MessageBody() data: any) {
        const ids = await this.findUserBySocketId(data.members);
        if (ids) this.publishMessage(event_name.conversation.seen, { ...data, members: ids });
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.conversation.typing)
    async IncomingClientTyping(@MessageBody() data: any) {
        const ids = await this.findUserBySocketId(data.members);
        if (ids) this.publishMessage(event_name.conversation.typing, { ...data, members: ids });
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.notification.post)
    async IncomingClientLikeNotification(@MessageBody() data: Notification) {
        const ids = await this.findUserBySocketId([data.recipientId]);
        if (ids) this.publishMessage(event_name.notification.post, { ...data, members: ids });
    }

    @SubscribeMessage('test')
    async test(@MessageBody() data: any) {
        console.log("receive to client : socket io:v0.1")
        this.publishMessage("test", { data });
    }
}
