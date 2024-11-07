import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';
import configuration from './configs/configuration';
import fastifyCookie from '@fastify/cookie';

const envs = configuration()

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: ['1']
  });

  app.enableCors({
    origin: true,
    credentials: true,
    exposedHeaders: ["set-cookie"]
  });

  await app.register(fastifyCookie, {
    secret: envs.JWT_SECRET,
  });

  await app.listen(5000, "0.0.0.0")
  for (const key in envs) {
    const element = envs[key];
    if (!element) {
      Logger.error(`[ENV] ${key}: ❌`)
    } else {
      Logger.log(`[ENV] ${key}: ${element} ✅`)
    }
  }
  Logger.log(`Application is running on: ${await app.getUrl()}`)
}

bootstrap();