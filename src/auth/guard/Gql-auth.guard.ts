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
      // Add the token to the request headers
      request.headers.authorization = `Bearer ${token}`;
      return request;
    }

    if (!request.headers.authorization) {
      throw new AuthenticationError('You are not logged-in.');
    }
    if (!request.headers.authorization.startsWith('Bearer ')) {
      request.headers.authorization = `Bearer ${request.headers.authorization}`;
    }
    return request;
  }
}