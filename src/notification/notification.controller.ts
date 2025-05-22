import { Body, Controller, Get, Param, Post, Req, Res, UseGuards, Version } from '@nestjs/common';
import Expo from 'expo-server-sdk';
import { FastifyReply, FastifyRequest } from 'fastify';
import { MyAuthGuard } from 'src/auth/guard/My-jwt-auth.guard';
import { RedisProvider } from 'src/db/redis/redis.provider';
import { RestApiSessionUser } from 'src/decorator/session.decorator';
import expo from 'src/lib/expo';
import { Author } from 'src/users/entities/author.entity';

@Controller({
    version: ['1'],
    path: "notification"
})
export class NotificationController {
    constructor(private readonly redisProvider: RedisProvider) { }

    @Version('1')
    @Get('/send')
    async sent(@Req() request: FastifyRequest, @Res() response: FastifyReply): Promise<any> {
        // const { pushToken, title, body, imageUrl } = request.body as any;

        // Validate push token
        if (!Expo.isExpoPushToken("ExponentPushToken[aPjYSFH7guogtVIDiwi8OS]")) {
            return response.send(`Invalid Expo push token`);
        }

        const message = {
            to: "ExponentPushToken[aPjYSFH7guogtVIDiwi8OS]",
            sound: 'default',
            title: 'Default Title',
            body: 'Default body',
            channelId: 'default',
            data: { withSome: 'data' },
            richContent: {
                image: 'https://example.com/fallback-image.jpg',
            },
        };

        try {
            const chunks = expo.chunkPushNotifications([message, message]);

            const tickets: any = [];

            for (let chunk of chunks) {
                try {
                    const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
                    tickets.push(...ticketChunk);
                } catch (error) {
                    console.error('Chunk error:', error);
                    return response.send(`Failed to send notification`);
                }
            }
            return response.send(`Expo push token success`);
        } catch (err) {
            console.error('Notification error:', err);
            return response.send(`Failed to send notification`);
        }
    }

    @Version('1')
    @Post(':id')
    @UseGuards(MyAuthGuard)
    async getMetrics(@RestApiSessionUser() session: Author, @Param('id') id: string,) {
        await this.redisProvider.client.set(`notification:${session.id}`, id, "EX", 3888000);
        return "success"
    }

}
