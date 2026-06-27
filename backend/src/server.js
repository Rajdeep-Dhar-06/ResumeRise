import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import app from './app.js';
import errorMiddleware from './middlewares/error.middleware.js';

dotenv.config({ path: './.env' }); //access env variables inside whole server

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    // Fallback error handler before app.listen(...)
    app.use(errorMiddleware);
    app.listen(PORT, () => {
      console.log(`Server is running at port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log('MongoDB connection failed !!! ', err);
  });
