import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authentication.route.js';
import interviewRouter from './routes/interview_report.route.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { apiLimiter } from './middlewares/ratelimiter.js';

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// global rate limiter
app.use('/api', apiLimiter);

// routes
app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);

// centralized error handling
app.use(errorMiddleware);

export default app;
