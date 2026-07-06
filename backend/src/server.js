import 'dotenv/config';
import { connectDB } from './config/db.js';
import app from './app.js';
import errorMiddleware from './middlewares/error.middleware.js';

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
