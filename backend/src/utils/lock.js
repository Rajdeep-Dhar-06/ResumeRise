import { redisClient } from "../config/redis.js";

const script =
    `
        if(redis.call('get', KEYS[1]) == ARGV[1]) then
            return redis.call('del', KEYS[1])
        else
            return 0
        end
    `;

export const acquireLock = async (lockKey, lockValue, lockTtl = 10) => {
    try {
        const result = await redisClient.set(lockKey, lockValue, 'EX', lockTtl, 'NX');
        return result === 'OK';
    } catch (error) {
        return false;
    }
}

export const releaseLock = async (lockKey, lockValue) => {
    try {
        const result = await redisClient.eval(script, 1, lockKey, lockValue);
        return result === 1;
    } catch (error) {
        return false;
    }
}

/**
 * Exponential backoff with jitter to prevent cache stampedes / thundering herds.
 */
export const delayWithJitter = (attempt, baseDelay = 200, maxDelay = 3000) => {
    const expDelay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
    const jitter = expDelay * (0.5 + Math.random() * 0.5);
    return new Promise(resolve => setTimeout(resolve, jitter));
}