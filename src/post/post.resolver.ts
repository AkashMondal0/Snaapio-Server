import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { PostService } from './post.service';
import { Post } from './entities/post.entity';
import { UseGuards } from '@nestjs/common';
import { SessionUserGraphQl } from 'src/decorator/session.decorator';
import { GqlAuthGuard } from 'src/auth/guard/Gql-auth.guard';
import { CreatePostInput } from './dto/create-post.input';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
import { Author } from 'src/users/entities/author.entity';
import { GqlRolesGuard } from 'src/auth/guard/Gql.roles.guard';
import { Throttle } from '@nestjs/throttler';
import { GqlThrottlerGuard } from 'src/auth/guard/GqlThrottler.Guard';

@Resolver(() => Post)
export class PostResolver {
  constructor(
    private readonly postService: PostService
  ) { }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Query(() => [Post], { name: 'feedTimelineConnection' })
  feedTimelineConnection(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") limitAndOffset: GraphQLPageQuery) {
    return this.postService.feed(user, limitAndOffset);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Query(() => [Post], { name: 'shortFeedTimelineConnection' })
  shortFeedTimelineConnection(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") limitAndOffset: GraphQLPageQuery) {
    return this.postService.shortFeed(user, limitAndOffset);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Query(() => [Post], { name: 'findAllPosts' })
  findPosts(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") findPosts: GraphQLPageQuery) {
    return this.postService.findPosts(user, findPosts);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Query(() => Post, { name: 'findOnePost' })
  findOnePost(@SessionUserGraphQl() user: Author, @Args('graphQLPageQuery') findPost: GraphQLPageQuery) {
    return this.postService.findOnePost(user, findPost.id);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Post, { name: 'createPost' })
  createPost(@SessionUserGraphQl() user: Author, @Args('createPostInput') createPostInput: CreatePostInput) {
    return this.postService.createPost(user, createPostInput);
  }

  // @UseGuards(GqlAuthGuard)
  // @Mutation(() => Post, { name: 'updatePost' })
  // updatePost(@SessionUserGraphQl() user: Author, @Args('createPostInput') createPostInput: CreatePostInput) {
  //   return this.postService.createPost(user, createPostInput);
  // }

  // @UseGuards(GqlAuthGuard)
  // @Mutation(() => Post, { name: 'deletePost' })
  // deletePost(@SessionUserGraphQl() user: Author, @Args('createPostInput') createPostInput: CreatePostInput) {
  //   return this.postService.createPost(user, createPostInput);
  // }
}
