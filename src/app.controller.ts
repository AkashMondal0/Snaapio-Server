import { Controller, Get, Req, Res, Version } from '@nestjs/common';
import { AppService } from './app.service';
import { FastifyReply, FastifyRequest } from 'fastify';
import { register } from 'prom-client';

@Controller({
  version: ['1'],
})
export class AppController {
  constructor(
    private appService: AppService,
  ) { }

  @Version('1')
  @Get('/app')
  LandingPage(@Req() request: FastifyRequest): any {
    return "Load App";
  }

  @Version('1')
  @Get('cookie')
  cookieSet(@Req() request: FastifyRequest, @Res({ passthrough: true }) response: FastifyReply): any {
    // this.httpRequestsTotal.labels(request.method, '/cookie', '200').inc(); // Increment the counter
    return response.send(request.cookies);
  }

  @Version('1')
  @Get('/metrics')
  async getMetrics(@Res() res: FastifyReply) {
    res.header('Content-Type', register.contentType);
    res.send(await register.metrics());
  }

  @Version('1')
  @Get("cookie-set")
  findAll(@Req() request: FastifyRequest, @Res({ passthrough: true }) response: FastifyReply) {
    // this.httpRequestsTotal.labels(request.method, '/cookie-set', '200').inc(); // Increment the counter
    response.setCookie('test', 'test_page', {
      path: "/",
      maxAge: 1000 * 60 * 60 * 24 * 30,
      httpOnly: true,
      priority: "medium"
    });
    return response.send(`Cookie value: ${`value`}`);
  }
}
