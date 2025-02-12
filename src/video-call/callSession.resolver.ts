import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CallSession, ParticipantsInput } from './dto/call-session';
import { CallSessionService } from './callSession.service';
import { GqlAuthGuard } from 'src/auth/guard/Gql-auth.guard';
import { UseGuards } from '@nestjs/common';
import { Author } from 'src/users/entities/author.entity';
import { SessionUserGraphQl } from 'src/decorator/session.decorator';

@Resolver(() => CallSession)
export class CallSessionResolver {
  constructor(private readonly CallSessionService: CallSessionService) { }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CallSession, { name: "createCallSession" })
  createCallSession(@SessionUserGraphQl() user: Author, @Args('participantInput') participantInput: ParticipantsInput) {
    return this.CallSessionService.create(user, participantInput);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CallSession, { name: "joinCallSession" })
  joinCallSession(@SessionUserGraphQl() user: Author, @Args('participantInput') participantInput: ParticipantsInput) {
    return this.CallSessionService.joinSession(user, participantInput);
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => CallSession, { name: "findCallSession" })
  findCallSession(@SessionUserGraphQl() user: Author, @Args('id', { type: () => String }) id: string) {
    return this.CallSessionService.findCallSession(user, id);
  }

  @UseGuards(GqlAuthGuard)
  @Mutation(() => CallSession)
  leaveSession(@SessionUserGraphQl() user: Author, @Args('id', { type: () => String }) id: string) {
    return this.CallSessionService.leaveSession(user, id);
  }

}
