import winston from 'winston';
import LokiTransport from 'winston-loki';

const lokiOptions = {
  host: process.env.LOKI_URL || 'http://loki:3100',
  labels: {
    app: 'pension-api',
    env: process.env.NODE_ENV || 'development',
  },
  json: true,
  batching: true,
  interval: 5,
  dynamicLabels: (info) => ({
    method: info.method,
    url: info.url,
    status: info.status,
    traceId: info.traceId,
  }),
};

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new LokiTransport(lokiOptions),
  ],
});
