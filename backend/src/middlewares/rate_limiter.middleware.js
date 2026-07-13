import rateLimit from 'express-rate-limit'

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