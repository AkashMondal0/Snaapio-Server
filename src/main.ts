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
import { Counter, Histogram, Gauge, register } from 'prom-client';

// Counter to track the total number of requests
const requestCounter = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

// Histogram to measure request duration
const requestDurationHistogram = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Histogram of HTTP request durations in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 1.5, 2, 3, 5], // Define custom buckets
});

// Gauge to track active users or other dynamic metrics
const activeUsersGauge = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
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
  register.setDefaultLabels({
    app: 'snaapio-server',
  });

  app.getHttpAdapter().getInstance().addHook('onResponse', (req, res, done) => {
    try {
      const { method, url } = req;
      // Check if the request is a GraphQL query or mutation
      if (url.startsWith('/graphql')) {
        const operationName = (req.body as { query?: string })?.query?.match(/(?:query|mutation)\s+(\w+)/)?.[1] || 'unknown';
        const operationType = (req.body as { query?: string })?.query?.trim().startsWith('mutation') ? 'mutation' : 'query';

        const statusCode = res.statusCode.toString();
        requestCounter.labels(operationType, operationName, statusCode).inc();
        requestDurationHistogram.labels(operationType, operationName, statusCode).observe(Math.random()); // Simulate
        activeUsersGauge.labels('123').set(Math.floor(Math.random() * 100)); // Simulated
      } else {
        const statusCode = res.statusCode.toString();
        requestCounter.labels(method, url, statusCode).inc();
        requestDurationHistogram.labels(method, url, statusCode).observe(Math.random()); // Simulate
        activeUsersGauge.labels('123').set(Math.floor(Math.random() * 100)); // Simulated
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