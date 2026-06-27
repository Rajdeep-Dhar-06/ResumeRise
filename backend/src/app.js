import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRouter from './routes/authentication.route.js';
import interviewRouter from './routes/interviewReport.route.js';
import errorMiddleware from './middlewares/error.middleware.js';

const app = express();

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);

// Centralized error handling
app.use(errorMiddleware);

export default app;
