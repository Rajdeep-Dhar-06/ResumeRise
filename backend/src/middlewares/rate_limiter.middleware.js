import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../config/redis.js';

/**
 * Reusable utility to create an Express rate-limiter middleware.
 * 
 * - Uses a Redis store backend for distributed counting.
 * - Returns a configured rate-limit request handler.
 * 
 * @param windowMinutes - Time window duration in minutes
 * @param maxRequests - Max number of requests allowed per window
 * @param errorMessage - Error message returned when limit is exceeded
 */
const createRateLimiter = (windowMinutes, maxRequests, errorMessage) => {
    return rateLimit({
        store: new RedisStore({
            sendCommand: (...args) => redisClient.sendCommand(args),
            prefix: 'rl:',
        }),
        windowMs: windowMinutes * 60 * 1000,
        max: maxRequests,
        standardHeaders: true,
        legacyHeaders: true,
        handler: (req, res) => {
            res.status(429).json({
                error: errorMessage || 'Too many requests, please try again later'
            })
        }
    })
}

export const reportLimiter = createRateLimiter(
    1,
    5,
    "Report generation limit reached. Please wait 60 seconds"
)

export const loginLimiter = createRateLimiter(
    5,
    3,
    "Login limit reached. Please wait 5 minutes"
)

export const parseLimiter = createRateLimiter(
    1,
    5,
    "Parsing limit reached, Please wait 60 seconds"
)

export const registerLimiter = createRateLimiter(
    60,
    5,
    "Registration limit reached. Please wait an hour"
)

export const apiLimiter = createRateLimiter(
    15,
    100,
    "Too many requests to the API. Please wait 15 minutes"
)