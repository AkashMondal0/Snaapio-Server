import { FastifyReply, FastifyRequest } from 'fastify';
import { Body, Controller, Post, UseGuards, Get, Version, UsePipes, Req, Res, } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from 'src/lib/validation/Validation';
import { LoginUserPayload, LoginUserSchema, RegisterUserPayload, RegisterUserSchema } from 'src/lib/validation/ZodSchema';
import { MyAuthGuard } from './guard/My-jwt-auth.guard';
import { RestApiSessionUser } from 'src/decorator/session.decorator';
import { Author } from 'src/users/entities/author.entity';

@Controller({
  path: 'auth',
  version: ['1']
})

export class AuthController {
  constructor(private authService: AuthService) { }

  @Version('1')
  @Post('login')
  @UsePipes(new ZodValidationPipe(LoginUserSchema))
  async signIn(@Body() body: LoginUserPayload, @Res({ passthrough: true }) response: FastifyReply) {
    return this.authService.signIn(response, body.email, body.password);
  }

  @Version('1')
  @Post('register')
  @UsePipes(new ZodValidationPipe(RegisterUserSchema))
  async signUp(@Body() body: RegisterUserPayload, @Res({ passthrough: true }) response: FastifyReply) {
    return this.authService.signUp(response, body);
  }

  @Version('1')
  @Post('logout')
  @UseGuards(MyAuthGuard)
  async signOut(@RestApiSessionUser() session: Author, @Req() request: FastifyRequest, @Res({ passthrough: true }) response: FastifyReply) {
    return this.authService.signOut(request, response, session);
  }

  @Version('1')
  @Get('session')
  @UseGuards(MyAuthGuard)
  getProfile(@RestApiSessionUser() user: Author) {
    return user;
  }
}