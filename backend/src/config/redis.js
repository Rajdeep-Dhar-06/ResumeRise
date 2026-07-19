import { createClient } from 'redis';
import logger from '../utils/logger.js';

export const redisClient = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
})

const connectionPromise = redisClient.connect();
redisClient.on('error', (err) => logger.error(err, 'Redis Client Error'));

/**
 * Establishes a connection to the Redis server.
 * 
 * - Awaits the initialized connection promise.
 * - Logs success or throws on connection failure.
 * 
 * @throws {Error} If connection fails
 */
export async function connectRedis() {
    try {
        await connectionPromise;
        logger.info('Redis Client Connected');
    } catch (error) {
        logger.fatal({ err: error }, 'Redis Client Connection Failed');
        throw error;
    }
}