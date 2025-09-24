import { Injectable, Logger } from '@nestjs/common';
import { DrizzleProvider } from 'src/db/drizzle/drizzle.provider';
import { CreateFriendshipInput } from './dto/create-friendship.input';
import { GraphQLError } from 'graphql';
import { DestroyFriendship } from './dto/delete-friendship.input';
import { and, eq, desc, exists, } from 'drizzle-orm';
import { FriendshipSchema, UserSchema } from 'src/db/drizzle/drizzle.schema';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
import { Author } from 'src/users/entities/author.entity';
import { RedisProvider } from 'src/db/redis/redis.provider';
import { Profile } from 'src/users/entities/profile.entity';
import { dataParser } from 'src/lib/dataParser';

@Injectable()
export class FriendshipService {
  constructor(private readonly drizzleProvider: DrizzleProvider,
    private readonly redisProvider: RedisProvider,
  ) { }

  async createFriendship(createFollowInput: CreateFriendshipInput): Promise<{ friendShip: boolean } | GraphQLError> {
    try {
      const check = await this.drizzleProvider.db.select().from(FriendshipSchema).where(and(
        eq(FriendshipSchema.followingUserId, createFollowInput.followingUserId),
        eq(FriendshipSchema.authorUserId, createFollowInput.authorUserId),
      ))
        .limit(1)

      if (check.length > 0) {
        throw new GraphQLError('Already following user', {
          extensions: {
            code: "ALREADY_FOLLOWING",
            http: { status: 401 },
          }
        })
      }

      await this.drizzleProvider.db.insert(FriendshipSchema).values({
        followingUsername: createFollowInput.followingUsername,
        authorUsername: createFollowInput.authorUsername,
        authorUserId: createFollowInput.authorUserId,
        followingUserId: createFollowInput.followingUserId,
      })

      const profileKey = `profile:user:${createFollowInput.followingUsername}:${createFollowInput.authorUserId}`;

      let profile = await this.redisProvider.client.get(profileKey);
      const parsedProfile = dataParser(profile) as Profile;

      if (parsedProfile) {
        parsedProfile.followed_by = true;
        parsedProfile.friendship = { ...(typeof parsedProfile.friendship === 'object' && parsedProfile.friendship !== null ? parsedProfile.friendship : {}), following: true };
        parsedProfile.followerCount = (typeof parsedProfile.followerCount === 'number' ? parsedProfile.followerCount : 0) + 1;
        await this.redisProvider.client.set(profileKey, JSON.stringify(parsedProfile), 'EX', 300);
      }

      return {
        friendShip: true,
      };

    } catch (error) {
      Logger.error(error)
      throw new GraphQLError('Internal Server Error', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }

  async deleteFriendship(destroyFriendship: DestroyFriendship): Promise<{ friendShip: boolean } | GraphQLError> {
    try {
      await this.drizzleProvider.db.delete(FriendshipSchema).where(and(
        eq(FriendshipSchema.followingUsername, destroyFriendship.followingUsername),
        eq(FriendshipSchema.authorUsername, destroyFriendship.authorUsername),
      ))

      const profileKey = `profile:user:${destroyFriendship.followingUsername}:${destroyFriendship.authorUserId}`;

      let profile = await this.redisProvider.client.get(profileKey);
      const parsedProfile = dataParser(profile) as Profile;

      if (parsedProfile) {
        parsedProfile.following = false;
        parsedProfile.friendship = { ...(typeof parsedProfile.friendship === 'object' && parsedProfile.friendship !== null ? parsedProfile.friendship : {}), following: false };
        parsedProfile.followerCount = (typeof parsedProfile.followerCount === 'number' && parsedProfile.followerCount > 0 ? parsedProfile.followerCount - 1 : 0);
        await this.redisProvider.client.set(profileKey, JSON.stringify(parsedProfile), 'EX', 300);
      }

      return {
        friendShip: false,
      }
    } catch (error) {
      Logger.error(error)
      throw new GraphQLError('Internal Server Error', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }

  async findAllFollowing(loggedUser: Author, Input: GraphQLPageQuery): Promise<Author[] | GraphQLError> {
    try {
      const data = await this.drizzleProvider.db.select({
        id: UserSchema.id,
        username: UserSchema.username,
        email: UserSchema.email,
        profilePicture: UserSchema.profilePicture,
        name: UserSchema.name,
        followed_by: exists(this.drizzleProvider.db.select()
          .from(FriendshipSchema).where(and(
            eq(FriendshipSchema.authorUsername, UserSchema.username),
            eq(FriendshipSchema.followingUsername, loggedUser.username),
          ))),
        following: exists(this.drizzleProvider.db.select()
          .from(FriendshipSchema).where(and(
            eq(FriendshipSchema.authorUsername, loggedUser.username),
            eq(FriendshipSchema.followingUsername, UserSchema.username),
          ))),
      })
        .from(FriendshipSchema)
        .where(eq(FriendshipSchema.authorUsername, Input.id),)
        .leftJoin(UserSchema, eq(FriendshipSchema.followingUsername, UserSchema.username))
        .orderBy(desc(FriendshipSchema.createdAt))
        .limit(Number(Input.limit) ?? 12)
        .offset(Number(Input.offset) ?? 0)

      return data as Author[]
    } catch (error) {
      Logger.error(error)
      throw new GraphQLError('Internal Server Error', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }

  async findAllFollower(loggedUser: Author, Input: GraphQLPageQuery): Promise<Author[] | GraphQLError> {
    try {
      const data = await this.drizzleProvider.db.select({
        id: UserSchema.id,
        username: UserSchema.username,
        email: UserSchema.email,
        profilePicture: UserSchema.profilePicture,
        name: UserSchema.name,
        following: exists(this.drizzleProvider.db.select()
          .from(FriendshipSchema).where(and(
            eq(FriendshipSchema.authorUsername, loggedUser.username),
            eq(FriendshipSchema.followingUsername, UserSchema.username),
          ))),
        followed_by: exists(this.drizzleProvider.db.select()
          .from(FriendshipSchema).where(and(
            eq(FriendshipSchema.authorUsername, UserSchema.username),
            eq(FriendshipSchema.followingUsername, loggedUser.username),
          ))),
      })
        .from(FriendshipSchema)
        .where(eq(FriendshipSchema.followingUsername, Input.id))
        .leftJoin(UserSchema, eq(FriendshipSchema.authorUsername, UserSchema.username))
        .orderBy(desc(FriendshipSchema.createdAt))
        .limit(Number(Input.limit) ?? 12)
        .offset(Number(Input.offset) ?? 0)

      return data as Author[]
    } catch (error) {
      Logger.error(error)
      throw new GraphQLError('Internal Server Error', {
        extensions: { code: 'INTERNAL_SERVER_ERROR' }
      });
    }
  }
}