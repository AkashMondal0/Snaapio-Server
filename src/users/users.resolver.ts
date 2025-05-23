import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { Profile } from './entities/profile.entity';
import { GqlAuthGuard } from 'src/auth/guard/Gql-auth.guard';
import { UseGuards } from '@nestjs/common';
import { SessionUserGraphQl } from 'src/decorator/session.decorator';
import { Author } from './entities/author.entity';
import { Users } from './entities/users.entity';
import { UpdateUsersInput } from './dto/update-users.input';
// import { GqlRolesGuard } from 'src/auth/guard/Gql.roles.guard';
// import { Roles } from 'src/auth/SetMetadata';
// import { Role } from 'src/lib/types';
// import { Throttle } from '@nestjs/throttler';
// import { GqlThrottlerGuard } from 'src/auth/guard/GqlThrottler.Guard';
import { GraphQLLocationQuery, GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
@Resolver(() => Users)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(GqlAuthGuard)
  @Query(() => Profile, { name: 'findUserProfile' })
  findUserProfile(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") graphQLPageQuery: GraphQLPageQuery) {
    return this.usersService.findProfile(user, graphQLPageQuery.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Author], { name: 'findUsersByKeyword' })
  findUsersByKeyword(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") graphQLPageQuery: GraphQLPageQuery) {
    return this.usersService.findUsersByKeyword(graphQLPageQuery.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Author], { name: 'findNearestUsers' })
  findNearestUsers(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") graphQLPageQuery: GraphQLLocationQuery) {
    return this.usersService.findNearestUsers(graphQLPageQuery.latitude, graphQLPageQuery.latitude, graphQLPageQuery.distance)
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Author, { name: 'updateUserProfile' })
  updateUserProfile(@SessionUserGraphQl() user: Author, @Args('UpdateUsersInput') updateUsersInput: UpdateUsersInput) {
    return this.usersService.updateProfile(user, updateUsersInput);
  }

  // example of rate limiting
  // @Throttle({ default: { limit: 1, ttl: 60000 } })
  // @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Query(() => Author, { name: 'getSession' })
  getSessionApi(@SessionUserGraphQl() user: Author) {
    // console.log(user);
    return user;
  }
}
