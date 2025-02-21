import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { StoryService } from './story.service';
import { Highlight, Story } from './entities/story.entity';
import { UseGuards } from '@nestjs/common';
import { SessionUserGraphQl } from 'src/decorator/session.decorator';
import { GqlAuthGuard } from 'src/auth/guard/Gql-auth.guard';
import { createHighlightInput, CreateStoryInput } from './dto/create-story.input';
import { Author } from 'src/users/entities/author.entity';
import { GraphQLPageQuery } from 'src/lib/types/graphql.global.entity';

@Resolver(() => Story)
export class StoryResolver {
  constructor(
    private readonly storyService: StoryService
  ) { }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Story], { name: 'findStory' })
  findOnePost(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") limitAndOffset: GraphQLPageQuery) {
    return this.storyService.findStory(user, limitAndOffset.id);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Story], { name: 'findAllStory' })
  findAllPost(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") limitAndOffset: GraphQLPageQuery) {
    return this.storyService.findAllPost(user, limitAndOffset);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Highlight], { name: 'findAllHighlight' })
  findAllHighlight(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") limitAndOffset: GraphQLPageQuery) {
    return this.storyService.findAllHighlight(user, limitAndOffset);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => Highlight, { name: 'findHighlight' })
  findHighlight(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") limitAndOffset: GraphQLPageQuery) {
    return this.storyService.findHighlight(user, limitAndOffset);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Author], { name: 'storyTimelineConnection' })
  storyTimelineConnection(@SessionUserGraphQl() user: Author, @Args("graphQLPageQuery") limitAndOffset: GraphQLPageQuery) {
    return this.storyService.storyTimelineConnection(user, limitAndOffset);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Story, { name: 'createStory' })
  createStory(@SessionUserGraphQl() user: Author, @Args('createStoryInput') createStoryInput: CreateStoryInput) {
    return this.storyService.createStory(user, createStoryInput);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Highlight, { name: 'createHighlight' })
  createHighlight(@SessionUserGraphQl() user: Author, @Args('createHighlightInput') createHighlight: createHighlightInput) {
    return this.storyService.createHighlight(user, createHighlight);
  }

}
