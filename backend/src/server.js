import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import app from './app.js'

dotenv.config({ path: './.env' }) //access env variables inside whole server

const PORT = process.env.PORT || 8000

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`⚙️  Server is running at port: ${PORT}`)
    })
  })
  .catch((err) => {
    console.log("MongoDB connection failed !!! ", err)
  })
 