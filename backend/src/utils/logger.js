import pino from 'pino';
import pinoHttp from 'pino-http';

const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

let logger;

if (isDev) {
  const pretty = (await import('pino-pretty')).default;
  logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: {
      paths: [
        'password',
        'accessToken',
        'refreshToken',
        'token',
        'req.headers.authorization',
        'req.headers.cookie',
      ],
      censor: '[REDACTED]',
    },
  }, pretty({
    colorize: true,
    translateTime: 'SYS:HH:MM:ss',
    ignore: 'pid,hostname',
    singleLine: false,
  }));
} else {
  logger = pino({
    level: process.env.LOG_LEVEL || 'info',
    redact: {
      paths: [
        'password',
        'accessToken',
        'refreshToken',
        'token',
        'req.headers.authorization',
        'req.headers.cookie',
      ],
      censor: '[REDACTED]',
    },
  });
}

/**
 * Express middleware for HTTP request logging.
 */
export const httpLogger = pinoHttp({
  logger,
  // ignore preflighted requests
  autoLogging: {
    ignore: (req) => req.method === 'OPTIONS',
  },
  // clean up the req and res for logging
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
    }),
    res: (res) => ({
      statusCode: res.statusCode,
    }),
  },
  customProps: (req) => ({
    reqId: req.id,
  }),
});

export default logger;

