import { Injectable, Logger, UseGuards } from '@nestjs/common';
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
import { RedisProvider } from 'src/db/redis/redis.provider';
import configuration from 'src/configs/configuration';
import Redis from 'ioredis';


@WebSocketGateway({
    cors: {
        origin: true,
        credentials: true,
    },
    transports: ['websocket'],
    namespace: "chat"
})

@Injectable()
export class EventGateway {
    @WebSocketServer()
    server: Server;
    socketClients: { [key: string]: string } = {}

    redisSubscriber: Redis;
    constructor(private readonly redisProvider: RedisProvider) { }

    async onModuleInit() {
        this.redisSubscriber = new Redis(configuration().REDIS_URL as any);

        if (!this.redisSubscriber) {
            Logger.log('Redis subscriber not initialized');
            return;
        }

        this.redisSubscriber.subscribe(
            event_name.conversation.message,
            event_name.conversation.seen,
            event_name.conversation.typing,
            event_name.notification.post,
            "test",
            (err, count) => {
                if (err) {
                    Logger.error('Failed to subscribe', err);
                    return;
                }
                Logger.log(`Subscribed to ${count} channel. Listening for updates on the channel.`);
                return
            });

        this.redisSubscriber.on("message", (channel, message) => {
            const data = JSON.parse(message)
            switch (channel) {
                case event_name.conversation.message:
                    this.server.to(data.members).emit(event_name.conversation.message, data);
                    return
                case event_name.conversation.seen:
                    this.server.to(data.members).emit(event_name.conversation.seen, data);
                    return
                case event_name.conversation.typing:
                    this.server.to(data.members).emit(event_name.conversation.typing, data);
                    return
                case event_name.notification.post:
                    this.server.to(data.members).emit(event_name.notification.post, data);
                    return
                default:
                    this.server.emit("test", data);
                    return
            }
        });
    }

    extractUserIdAndName(client: Socket): { userId: string, username: string } | null {
        if (!client.id) return null
        const {
            userId,
            username
        } = client.handshake.query as {
            userId: string,
            username: string
        }
        if (!userId || !username) return null
        return { userId, username }
    }


    // async findUserBySocketId(userIds?: string[]): Promise<string[] | null> {
    //     if (!userIds || userIds.length < 0) return null
    //     const ids = await Promise.all(userIds?.map(async (userId) => {
    //         return this.socketClients[userId]
    //     }) ?? []);
    //     if (!ids || ids.length < 0) return null
    //     return ids.filter(id => id !== null || id !== undefined) as string[];
    // }

    async findUserBySocketId(userIds?: string[]): Promise<string[] | null> {

        if (!userIds || userIds.length < 0) return null

        const ids = await Promise.all(userIds?.map(async (userId) => {
            return await this.redisProvider.client.hget("skylight:clients", userId);
        }) ?? []);

        if (!ids || ids.length < 0) return null

        return ids.filter(id => id !== null) as string[];
    }

    // async handleConnection(client: Socket) {
    //     const userId = client.handshake.query?.userId as string
    //     if (!userId) return
    //     this.socketClients[userId] = client.id
    // }

    async handleConnection(client: Socket) {
        const userId = this.extractUserIdAndName(client)?.userId;
        if (!userId) return;
        await this.redisProvider.client.hset("skylight:clients", userId, client.id);
    }

    // async handleDisconnect(client: Socket) {
    //     const userId = client.handshake.query?.userId as string
    //     if (!userId) return
    //     delete this.socketClients[userId]
    // }

    async handleDisconnect(client: Socket) {
        const userId = this.extractUserIdAndName(client)?.userId
        if (!userId) return
        await this.redisProvider.client.hdel("skylight:clients", userId)
    }

    /// user message
    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.conversation.message)
    async IncomingClientMessage(
        @MessageBody() data: any
    ) {
        const ids = await this.findUserBySocketId(data.members)
        if (!ids) return
        // this.server.to(ids).emit(event_name.conversation.message, data);
        this.redisProvider.client.publish(event_name.conversation.message, JSON.stringify({ ...data, members: ids }))
    }

    /// user seen message
    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.conversation.seen)
    async IncomingClientMessageSeen(
        @MessageBody() data: any
    ) {
        const ids = await this.findUserBySocketId(data.members)
        if (!ids) return
        // this.server.to(ids).emit(event_name.conversation.seen, data);
        this.redisProvider.client.publish(event_name.conversation.seen, JSON.stringify({ ...data, members: ids }))
    }

    /// user typing
    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.conversation.typing)
    async IncomingClientTyping(
        @MessageBody() data: any
    ) {
        const ids = await this.findUserBySocketId(data.members)
        if (!ids) return
        // this.server.to(ids).emit(event_name.conversation.typing, data);
        this.redisProvider.client.publish(event_name.conversation.typing, JSON.stringify({ ...data, members: ids }));
    }
    // notification

    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.notification.post)
    async IncomingClientLikeNotification(
        @MessageBody() data: Notification
    ) {
        const ids = await this.findUserBySocketId([data.recipientId])
        if (!ids) return
        // this.server.to(ids).emit(event_name.notification.post, data);
        this.redisProvider.client.publish(event_name.notification.post, JSON.stringify({ ...data, members: ids }));
    }

    // @UseGuards(WsJwtGuard)
    // @UsePipes(new ValidationPipe())
    @SubscribeMessage('test')
    async test(
        @MessageBody() data: any,
    ) {
        this.server.emit('test', "this from server - > test");
    }
}