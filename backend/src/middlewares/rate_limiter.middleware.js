import rateLimit from 'express-rate-limit';

/**
 * Reusable utility to create an Express rate-limiter middleware.
 * 
 * - Uses the default in-memory store
 * - Returns a configured rate-limit request handler.
 * 
 * @param windowMinutes - Time window duration in minutes
 * @param maxRequests - Max number of requests allowed per window
 * @param errorMessage - Error message returned when limit is exceeded
 */
const createRateLimiter = (windowMinutes, maxRequests, errorMessage) => {
    return rateLimit({
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
    20,
    "Report generation limit reached. Please wait 60 seconds"
)

export const loginLimiter = createRateLimiter(
    5,
    10,
    "Login limit reached. Please wait 5 minutes"
)

export const registerLimiter = createRateLimiter(
    60,
    5,
    "Registration limit reached. Please wait an hour"
)