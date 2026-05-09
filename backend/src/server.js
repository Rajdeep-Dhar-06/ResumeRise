import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import app from './app.js';

dotenv.config({ path: './.env' }); //access env variables inside whole server

const PORT = process.env.PORT || 8000;

connectDB()
  .then(() => {
    // Add this right before app.listen(...)
    app.use((err, req, res, next) => {
      console.error('🔥 CAUGHT BY GLOBAL ERROR HANDLER:', err);
      res.status(500).json({ error: 'Something broke in the middleware!' });
    });
    app.listen(PORT, () => {
      console.log(`⚙️  Server is running at port: ${PORT}`);
    });
  })
  .catch((err) => {
    console.log('MongoDB connection failed !!! ', err);
  });
