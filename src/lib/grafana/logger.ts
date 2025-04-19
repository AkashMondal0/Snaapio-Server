import { Logger } from '@nestjs/common';
import * as winston from 'winston';
import LokiTransport from 'winston-loki';

if (!process.env.LOKI_TRANSPORT) {
	Logger.error('LOKI_TRANSPORT environment variable is not set');
};

export const logger = winston.createLogger({
	transports: [
		new LokiTransport({
			host: process.env.LOKI_TRANSPORT || "http://192.168.31.232:3100",
			labels: { app: 'nestjs-app' },
			json: true,
			replaceTimestamp: true,
		}),
		new winston.transports.Console(),
	],
});
