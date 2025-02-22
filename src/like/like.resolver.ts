import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { LikeService } from './like.service';
import { Like } from './entities/like.entity';
import { SessionUserGraphQl } from 'src/decorator/session.decorator';
import { GqlAuthGuard } from 'src/auth/guard/Gql-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Author } from 'src/users/entities/author.entity';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
import { CreateLikeInput } from './dto/create-like.input';

@Resolver(() => Like)
export class LikeResolver {
  constructor(private readonly likeService: LikeService) { }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Boolean, { name: 'Like' })
  createAndDestroyLike(@SessionUserGraphQl() user: Author, @Args('input') input: CreateLikeInput) {
    return this.likeService.likeAndDestroy(user, input);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Author], { name: 'findAllLikes' })
  findAllLikes(@SessionUserGraphQl() user: Author, @Args('graphQLPageQuery') findAllLikesInput: GraphQLPageQuery) {
    return this.likeService.findAll(user, findAllLikesInput);
  }
}
