import * as winston from 'winston';
import LokiTransport from 'winston-loki';

if (!process.env.LOKI_TRANSPORT) {
	throw new Error('LOKI_TRANSPORT environment variable is not set');
};

export const logger = winston.createLogger({
	transports: [
		new LokiTransport({
			host: process.env.LOKI_TRANSPORT,
			labels: { app: 'nestjs-app' },
			json: true,
			replaceTimestamp: true,
		}),
		new winston.transports.Console(),
	],
});
