import rateLimit from 'express-rate-limit'

/**
 * Reusable utility to create an Express rate-limiter middleware.
 * 
 * @param {number} windowMinutes - Time window duration in minutes.
 * @param {number} maxRequests - Max number of requests allowed per window.
 * @param {string} errorMessage - Error message returned when rate limit is exceeded.
 * @returns {import('express-rate-limit').RateLimitRequestHandler}
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