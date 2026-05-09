#!/bin/bash

echo "🚀 Initializing Backend in current directory..."

# 1. Initialize npm and set ES Modules
# Using -y to skip prompts, then forcing "type": "module"
npm init -y
npm pkg set type="module"
npm pkg set scripts.dev="nodemon src/server.js"

# 2. Install Dependencies
echo "📦 Installing dependencies..."
npm install express dotenv mongoose cookie-parser cors jsonwebtoken bcrypt
npm install -D nodemon prettier

# 3. Create Directory Structure
mkdir -p src/controllers src/routes src/models src/middlewares src/utils src/config src/services

# 4. Create Configuration Files
cat <<EOF > .gitignore
node_modules
.env
.DS_Store
dist
EOF

cat <<EOF > .prettierrc
{
  "singleQuote": true,
  "semi": false,
  "tabWidth": 2,
  "trailingComma": "es5"
}
EOF

cat <<EOF > .env
PORT=5000
MONGO_URI=mongodb://localhost:27017/testdb
JWT_SECRET=supersecret_change_me
EOF

# 5. Create core Utility (asyncHandler)
cat <<EOF > src/utils/asyncHandler.js
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}
EOF

# 6. Create Database Config
cat <<EOF > src/config/db.js
import mongoose from 'mongoose'

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI)
    console.log(\`✅ MongoDB Connected: \${conn.connection.host}\`)
  } catch (error) {
    console.error(\`❌ Error: \${error.message}\`)
    process.exit(1)
  }
}
EOF

# 7. Create App Logic
cat <<EOF > src/app.js
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import userRouter from './routes/user.routes.js'

const app = express()

app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(cookieParser())

// Routes
app.use('/api/v1/users', userRouter)

export default app
EOF

# 8. Create Entry Point (server.js)
cat <<EOF > src/server.js
import dotenv from 'dotenv'
import { connectDB } from './config/db.js'
import app from './app.js'

dotenv.config({ path: './.env' })

const PORT = process.env.PORT || 8000

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(\`⚙️  Server is running at port: \${PORT}\`)
    })
  })
  .catch((err) => {
    console.log("MongoDB connection failed !!! ", err)
  })
EOF

# 9. Create Boilerplate Route/Controller
cat <<EOF > src/controllers/user.controller.js
import { asyncHandler } from '../utils/asyncHandler.js'

export const testUser = asyncHandler(async (req, res) => {
  res.status(200).json({ 
    success: true, 
    message: "User route is working correctly!" 
  })
})
EOF

cat <<EOF > src/routes/user.routes.js
import { Router } from 'express'
import { testUser } from '../controllers/user.controller.js'

const router = Router()

router.route('/test').get(testUser)

export default router
EOF

echo -e "\n---"
echo -e "✅ Files generated in current folder!"
echo -e "Run: npm run dev"
