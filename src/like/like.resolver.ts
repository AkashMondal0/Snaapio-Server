import { Resolver, Query, Mutation, Args} from '@nestjs/graphql';
import { LikeService } from './like.service';
import { Like } from './entities/like.entity';
import { SessionUserGraphQl } from 'src/decorator/session.decorator';
import { GqlAuthGuard } from 'src/auth/guard/Gql-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Author } from 'src/users/entities/author.entity';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';

@Resolver(() => Like)
export class LikeResolver {
  constructor(private readonly likeService: LikeService) { }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Like, { name: 'createLike' })
  createLike(@SessionUserGraphQl() user: Author, @Args('id', { type: () => String }) postId: string) {
    return this.likeService.create(user, postId);
  }
  
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Like, { name: 'destroyLike' })
  destroyLike(@SessionUserGraphQl() user: Author, @Args('id', { type: () => String }) postId: string) {
    return this.likeService.remove(user, postId);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Author], { name: 'findAllLikes' })
  findAllLikes(@SessionUserGraphQl() user: Author, @Args('graphQLPageQuery') findAllLikesInput: GraphQLPageQuery) {
    return this.likeService.findAll(user, findAllLikesInput);
  }
}
