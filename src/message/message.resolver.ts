import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { MessageService } from './message.service';
import { Message } from './entities/message.entity';
import { SessionUserGraphQl } from 'src/decorator/session.decorator';
import { Author } from 'src/users/entities/author.entity';
import { GraphQLPageQuery, TypingStatusInput } from 'src/lib/types/graphql.global.entity';
import { CreateMessageInput, CreateMessageInputSeen } from './dto/create-message.input';
import { GqlAuthGuard } from 'src/auth/guard/Gql-auth.guard';
import { UseGuards } from '@nestjs/common';

@Resolver(() => Message)
export class MessageResolver {
  constructor(private readonly messageService: MessageService) { }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Message)
  createMessage(@SessionUserGraphQl() user: Author, @Args('createMessageInput') createMessageInput: CreateMessageInput) {
    return this.messageService.create(user, createMessageInput);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => Message)
  seenMessages(@SessionUserGraphQl() user: Author, @Args('createMessageInputSeen') createMessageInputSeen: CreateMessageInputSeen) {
    return this.messageService.seenMessages(user, createMessageInputSeen);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => [Message], { name: 'findAllMessages' })
  findAllMessages(@SessionUserGraphQl() user: Author, @Args('graphQLPageQuery') graphQLPageQuery: GraphQLPageQuery) {
    return this.messageService.findAll(user, graphQLPageQuery);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => String, { name: 'typingStatus' })
  typingStatus(@Args('typingStatusInput') typingStatus: TypingStatusInput) {
    return this.messageService.typingStatus(typingStatus);
  }
}
