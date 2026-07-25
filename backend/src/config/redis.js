import Redis from 'ioredis';
import logger from '../utils/logger.js';

export const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null,
});

redisClient.on('error', (err) => logger.error(err, 'Redis Client Error'));