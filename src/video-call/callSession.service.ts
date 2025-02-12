import { Injectable, Logger } from '@nestjs/common';
import { EventGateway } from 'src/event/event.gateway';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { RedisProvider } from 'src/db/redis/redis.provider';
import { CallSession, ParticipantsInput } from './dto/call-session';
import { generateRandomString } from 'src/lib/id-generate';
import { GraphQLError } from 'graphql';
import { Author } from 'src/users/entities/author.entity';
const nameRD = "callsession:";
@Injectable()
export class CallSessionService {

  constructor(
    private readonly drizzleProvider: DrizzleProvider,
    private readonly eventProvider: EventGateway,
    private readonly redisProvider: RedisProvider
  ) { }

  async create(user: Author, participantInput: ParticipantsInput) {
    try {
      const addUser = {
        riseHand: participantInput.riseHand || false,
        micOn: participantInput.micOn || false,
        videoOn: participantInput.videoOn || false,
        user: {
          email: user.email,
          name: user.name,
          profilePicture: user?.profilePicture,
          id: user.id,
          username: user.username
        }
      };

      const newRoomSession: CallSession = {
        createdAt: new Date().toISOString(),
        sessionId: generateRandomString({}),
        participants: [addUser]
      };
      await this.redisProvider.client.set(nameRD + newRoomSession.sessionId, JSON.stringify(newRoomSession));
      return newRoomSession;
    } catch (error) {
      Logger.error(error);
      throw new GraphQLError('Internal Server Error', {
        extensions: { code: 'INTERNAL_ERROR' }
      });
    }
  }

  async joinSession(user: Author, participantInput: ParticipantsInput) {
    try {
      const existing = await this.redisProvider.client.get(nameRD + participantInput.sessionId) as string;
      if (!existing) {
        throw new GraphQLError('Not Found', {
          extensions: { code: 'NOT_FOUND' }
        });
      };
      const call_session = JSON.parse(existing) as CallSession;
      if (!call_session.sessionId) {
        throw new GraphQLError('Not Found', {
          extensions: { code: 'NOT_FOUND' }
        });
      };
      const addUser = {
        riseHand: participantInput.riseHand || false,
        micOn: participantInput.micOn || false,
        videoOn: participantInput.videoOn || false,
        user: {
          email: user.email,
          name: user.name,
          profilePicture: user?.profilePicture,
          id: user.id,
          username: user.username
        }
      };
      call_session.participants.push(addUser);
      await this.redisProvider.client.set(nameRD + participantInput.sessionId, JSON.stringify(call_session));
      return call_session;
    } catch (error) {
      Logger.error(error);
      throw new GraphQLError('Internal Server Error', {
        extensions: { code: 'INTERNAL_ERROR' }
      });
    }
  }

  async findCallSession(user: Author, id: string) {
    try {
      const existing = await this.redisProvider.client.get(nameRD + id) as string;
      if (!existing) {
        throw new GraphQLError('Not Found', {
          extensions: { code: 'NOT_FOUND' }
        });
      };
      return JSON.parse(existing)
    } catch (error) {
      Logger.error(error);
      throw new GraphQLError('Internal Server Error', {
        extensions: { code: 'INTERNAL_ERROR' }
      });
    }
  }

  async leaveSession(user: Author, id: string) {
    try {
      const existing = await this.redisProvider.client.get(nameRD + id) as string;
      if (!existing) {
        throw new GraphQLError('Not Found', {
          extensions: { code: 'NOT_FOUND' }
        });
      };
      const call_session = JSON.parse(existing) as CallSession;
      if (!call_session.sessionId) {
        throw new GraphQLError('Not Found', {
          extensions: { code: 'NOT_FOUND' }
        });
      };
      call_session.participants = call_session.participants.filter(participant => participant.user.id !== user.id);
      await this.redisProvider.client.set(nameRD + id, JSON.stringify(call_session));
      return call_session;
    } catch (error) {
      Logger.error(error);
      throw new GraphQLError('Internal Server Error', {
        extensions: { code: 'INTERNAL_ERROR' }
      });
    }
  }
}
