import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import configuration from 'src/configs/configuration';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../SetMetadata';

@Injectable()
export class MyAuthGuard implements CanActivate {
  constructor(private jwtService: JwtService,
    private reflector: Reflector
  ) { }

  private extractTokenFromHeader(request: FastifyRequest): string | undefined {
    // const [type, token] = request.headers.authorization?.split(' ') ?? [];
    // return type === 'Bearer' ? token : undefined;
    return request.cookies[configuration().COOKIE_NAME];
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    // if request is public, return true
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    // if request is not public, check for token
    
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request) || request.headers.authorization;

    if (!token) {
      throw new UnauthorizedException();
    }
    try {
      const payload = await this.jwtService.verifyAsync(token, { secret: configuration().JWT_SECRET });
      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;
    } catch (error) {
      Logger.error(error);
      throw new UnauthorizedException();
    }
    return true;
  }
}