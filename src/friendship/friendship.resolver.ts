import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { FriendshipService } from './friendship.service';
import { Friendship } from './entities/friendship.entity';
import { CreateFriendshipInput } from './dto/create-friendship.input';
import { DestroyFriendship } from './dto/delete-friendship.input';
import { GqlAuthGuard } from 'src/auth/guard/Gql-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Author } from 'src/users/entities/author.entity';
import { SessionUserGraphQl } from 'src/decorator/session.decorator';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
import { Throttle } from '@nestjs/throttler';
import { GqlThrottlerGuard } from 'src/auth/guard/GqlThrottler.Guard';


@Resolver(() => Friendship)
export class FriendshipResolver {
  constructor(private readonly friendshipService: FriendshipService) { }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Friendship, { name: 'createFriendship' })
  createFriendship(@Args('createFriendshipInput') createFriendshipInput: CreateFriendshipInput) {
    return this.friendshipService.createFriendship(createFriendshipInput);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Friendship, { name: 'destroyFriendship' })
  destroyFriendship(@Args('destroyFriendship') destroyFriendship: DestroyFriendship) {
    return this.friendshipService.deleteFriendship(destroyFriendship);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Query(() => [Author], { name: 'findAllFollower' })
  findAllFollower(@SessionUserGraphQl() user: Author, @Args('graphQLPageQuery') viewFollower: GraphQLPageQuery) {
    return this.friendshipService.findAllFollower(user, viewFollower);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Query(() => [Author], { name: 'findAllFollowing' })
  findAllFollowing(@SessionUserGraphQl() user: Author, @Args('graphQLPageQuery') viewFollowing: GraphQLPageQuery) {
    return this.friendshipService.findAllFollowing(user, viewFollowing);
  }
}
