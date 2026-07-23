import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import authRouter from './routes/authentication.route.js';
import interviewRouter from './routes/interview_report.route.js';
import errorMiddleware from './middlewares/error.middleware.js';
import { httpLogger } from './utils/logger.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(httpLogger);

app.use(express.json());
app.use(cors({ origin: process.env.CORS_ORIGIN || 'http://localhost:5173', credentials: true }));
app.use(express.urlencoded({ extended: true, limit: '16kb' }));
app.use(cookieParser());

// health check
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// routes
app.use('/api/auth', authRouter);
app.use('/api/interview', interviewRouter);

// fallback
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// centralized error handling
app.use(errorMiddleware);

export default app;
