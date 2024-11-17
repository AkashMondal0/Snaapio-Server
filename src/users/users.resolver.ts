import { Resolver, Query, Args, Mutation } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { Profile } from './entities/profile.entity';
import { GqlAuthGuard } from 'src/auth/guard/Gql-auth.guard';
import { UseGuards } from '@nestjs/common';
import { SessionUserGraphQl } from 'src/decorator/session.decorator';
import { Author } from './entities/author.entity';
import { Users } from './entities/users.entity';
import { UpdateUsersInput } from './dto/update-users.input';
import { GqlRolesGuard } from 'src/auth/guard/Gql.roles.guard';
import { Roles } from 'src/auth/SetMetadata';
import { Role } from 'src/lib/types';
import { Throttle } from '@nestjs/throttler';
import { GqlThrottlerGuard } from 'src/auth/guard/GqlThrottler.Guard';
@Resolver(() => Users)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) { }

  @UseGuards(GqlAuthGuard)
  @Query(() => Profile, { name: 'findUserProfile' })
  findUserProfile(@SessionUserGraphQl() user: Author, @Args('username', { type: () => String }) username: string) {
    return this.usersService.findProfile(user, username);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Author], { name: 'findUsersByKeyword' })
  findUsersByKeyword(@SessionUserGraphQl() user: Author, @Args('keyword', { type: () => String }) keyword: string) {
    return this.usersService.findUsersByKeyword(keyword);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Author, { name: 'updateUserProfile' })
  updateUserProfile(@SessionUserGraphQl() user: Author, @Args('UpdateUsersInput') updateUsersInput: UpdateUsersInput) {
    return this.usersService.updateProfile(user, updateUsersInput);
  }

  // example of rate limiting
  // @UseGuards(GqlAuthGuard)
  @UseGuards(GqlThrottlerGuard)
  @Throttle({ default: { limit: 1, ttl: 60000 } })
  @Query(() => String, { name: 'test' })
  Test(@SessionUserGraphQl() user: Author) {
    // console.log(user);
    return "Test";
  }
}
