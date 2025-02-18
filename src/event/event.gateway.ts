import Redis from 'ioredis';
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
                // message
                event_name.conversation.message,
                event_name.conversation.seen,
                event_name.conversation.typing,
                // notification
                event_name.notification.post,
                // call
                event_name.webRtc.offer,
                event_name.webRtc.answer,
                event_name.webRtc.candidate,
                event_name.webRtc.peerLeft,
                event_name.webRtc.sendCall,
                event_name.webRtc.answerCall,
                "test",
            );

            redisSubscriber.on("message", (channel, message) => {
                const data = JSON.parse(message);
                if (channel === "test") {
                    console.log("From Server : Redis SUB :v1", channel);
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
        if (ids.length <= 0) return null;
        return ids.filter(Boolean) as string[];
    }

    async getUserIdBySocketId(userId?: string): Promise<string | null> {
        if (typeof userId !== 'string') return null;
        const socketId = await this.client.hget("skylight:clients", userId);
        if (!socketId && typeof socketId !== 'string') return null;
        return socketId;
    }
    // new code
    async publishMessageToSocket(channel: string, data: any) {
        const ids = await this.getUserIdBySocketId(data.remoteId);
        if (!ids) return;
        this.client.publish(channel, JSON.stringify({ ...data, members: [ids] }));
    }

    async publishMessage(channel: string, data: any) {
        const ids = await this.findUserBySocketId(data.members);
        if (!ids) return;
        this.client.publish(channel, JSON.stringify({ ...data, members: ids }));
    }

    async handleConnection(client: Socket) {
        const userId = this.extractUserIdAndName(client)?.userId;
        if (userId) await this.client.hset("skylight:clients", userId, client.id);
    }

    async handleDisconnect(client: Socket) {
        const userId = this.extractUserIdAndName(client)?.userId;
        if (userId) await this.client.hdel("skylight:clients", userId);
    }

    // OFFER EVENT
    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.webRtc.offer)
    async handleOffer(@MessageBody() data: {
        userId: string,
        members: string[],
        data: any,
    }) {
        this.publishMessageToSocket(event_name.webRtc.offer, data)
    }

    // ANSWER EVENT
    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.webRtc.answer)
    async handleAnswer(@MessageBody() data: {
        userId: string,
        members: string[],
        data: any,
    }) {
        this.publishMessageToSocket(event_name.webRtc.answer, data)
    }

    // CANDIDATE EVENT
    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.webRtc.candidate)
    async handleCandidate(@MessageBody() data: {
        userId: string,
        members: string[],
        data: any,
    }) {
        this.publishMessageToSocket(event_name.webRtc.candidate, data)
    }

    // handlePeerLeft EVENT
    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.webRtc.peerLeft)
    async handlePeerLeft(@MessageBody() data: {
        userId: string,
        members: string[],
        data: any,
    }) {
        this.publishMessageToSocket(event_name.webRtc.peerLeft, data)
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.webRtc.sendCall)
    async handleSendCall(@MessageBody() data: any) {
        this.publishMessageToSocket(event_name.webRtc.sendCall, data)
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage(event_name.webRtc.answerCall)
    async handleAnswerCall(@MessageBody() data: any) {
        this.publishMessageToSocket(event_name.webRtc.answerCall, data)
    }

    @UseGuards(WsJwtGuard)
    @SubscribeMessage('test')
    async test(@MessageBody() data: any) {
        console.log("receive to client : socket io:v0.1")
        this.publishMessage("test", { data });
    }
}
