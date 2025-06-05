import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { StoryService } from './story.service';
import { Highlight, Story } from './entities/story.entity';
import { UseGuards } from '@nestjs/common';
import { SessionUserGraphQl } from 'src/decorator/session.decorator';
import { GqlAuthGuard } from 'src/auth/guard/Gql-auth.guard';
import { createHighlightInput, CreateStoryInput } from './dto/create-story.input';
import { Author } from 'src/users/entities/author.entity';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';
import { GqlThrottlerGuard } from 'src/auth/guard/GqlThrottler.Guard';
import { Throttle } from '@nestjs/throttler';

@Resolver(() => Story)
export class StoryResolver {
  constructor(
    private readonly storyService: StoryService
  ) { }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Query(() => [Story], { name: 'findStory' })
  findOnePost(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") limitAndOffset: GraphQLPageQuery) {
    return this.storyService.findStory(user, limitAndOffset.id);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Query(() => [Story], { name: 'findAllStory' })
  findAllPost(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") limitAndOffset: GraphQLPageQuery) {
    return this.storyService.findAllPost(user, limitAndOffset);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Query(() => [Highlight], { name: 'findAllHighlight' })
  findAllHighlight(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") limitAndOffset: GraphQLPageQuery) {
    return this.storyService.findAllHighlight(user, limitAndOffset);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Query(() => Highlight, { name: 'findHighlight' })
  findHighlight(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") limitAndOffset: GraphQLPageQuery) {
    return this.storyService.findHighlight(user, limitAndOffset);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Query(() => [Author], { name: 'storyTimelineConnection' })
  storyTimelineConnection(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") limitAndOffset: GraphQLPageQuery) {
    return this.storyService.storyTimelineConnection(user, limitAndOffset);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Story, { name: 'createStory' })
  createStory(@SessionUserGraphQl() user: Author, @Args('createStoryInput') createStoryInput: CreateStoryInput) {
    return this.storyService.createStory(user, createStoryInput);
  }

  @Throttle({ default: { limit: 3, ttl: 1000 } })
  @UseGuards(GqlThrottlerGuard)
  @UseGuards(GqlAuthGuard)
  @Mutation(() => Highlight, { name: 'createHighlight' })
  createHighlight(@SessionUserGraphQl() user: Author, @Args('createHighlightInput') createHighlight: createHighlightInput) {
    return this.storyService.createHighlight(user, createHighlight);
  }

}
