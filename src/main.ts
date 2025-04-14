import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { Logger, VersioningType } from '@nestjs/common';
import configuration from './configs/configuration';
import fastifyCookie from '@fastify/cookie';
import multipart from '@fastify/multipart';
import { Counter, Histogram, Gauge } from 'prom-client';
import {
  makeCounterProvider,
  makeHistogramProvider,
  makeGaugeProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';

const counter = new Counter({
  name: 'total_request_count',
  help: 'Total number of custom metric events',
  labelNames: ['method', 'url'],
});

const histogram = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Request duration in seconds',
  labelNames: ['method', 'url'],
});

const gauge = new Gauge({
  name: 'total_users',
  help: 'Simulated total user count',
  labelNames: ['user_id'],
});

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

  await app.register(fastifyCookie as any, {
    secret: envs.JWT_SECRET,
  });
  // Register multipart support for Fastify
  await app.register(multipart as any);

  app.getHttpAdapter().getInstance().addHook('onResponse', (req, res, done) => {
    try {
      const { method, url } = req;

      // Check if the request is a GraphQL query or mutation
      if (url.startsWith('/graphql')) {
        const operationName = (req.body as { query?: string })?.query?.match(/(?:query|mutation)\s+(\w+)/)?.[1] || 'unknown';
        const operationType = (req.body as { query?: string })?.query?.trim().startsWith('mutation') ? 'mutation' : 'query';

        counter.labels(operationType, operationName).inc();
        histogram.labels(operationType, operationName).observe(Math.random()); // Simulate
        gauge.labels('123').set(Math.floor(Math.random() * 100)); // Simulated
      } else {
        counter.labels(method, url).inc();
        histogram.labels(method, url).observe(Math.random()); // Simulate
        gauge.labels('123').set(Math.floor(Math.random() * 100)); // Simulated
      }
    } catch (err) {
      console.error('Error in onResponse hook:', err);
    }
    done();
  });

  await app.listen(5000, "0.0.0.0");
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