import { AuthenticationError } from "@nestjs/apollo";
import { Injectable, ExecutionContext } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { AuthGuard } from "@nestjs/passport";
import configuration from "src/configs/configuration";

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    const request = ctx.getContext().req;

    // Get the token from the cookies
    const token = request.cookies[configuration().COOKIE_NAME];

    if (token) {
      request.headers.authorization = `Bearer ${token}`;
      return request;
    }

    // If no token in cookies, check authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      throw new AuthenticationError('You are not logged-in.');
    }
    if (!authHeader.startsWith('Bearer ')) {
      request.headers.authorization = `Bearer ${authHeader}`;
    }
    return request;
  }
}
