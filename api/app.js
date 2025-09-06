import express from 'express';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import userRouter from './routes/user.route.js';
import { connectToDatabase } from "./lib/mongoDB.js";
import cors from 'cors';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error('Missing required environment variable: MONGO_URI');
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '16kb' }));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Config endpoint for frontend to get API base
app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  const baseURL = process.env.NODE_ENV === 'production'
    ? `https://${req.get('host')}/api`
    : process.env.BASE_URL || `${req.protocol}://${req.get('host')}/api`;
  res.send(`window.API_BASE = "${baseURL}";`);
});

// Serve static files only in development
if (process.env.NODE_ENV !== 'production') {
  const publicPath = path.join(__dirname, '..', 'public');
  app.use(express.static(publicPath));
  app.get('/', (req, res) => res.sendFile(path.join(publicPath, 'index.html')));
}

// Connect to DB once before handling requests
let dbConnected = false;
app.use(async (req, res, next) => {
  if (!dbConnected) {
    try {
      await connectToDatabase();
      dbConnected = true;
    } catch (error) {
      return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
  }
  next();
});

// API routes
app.use('/', userRouter);

// Health check
app.get('/ping', (req, res) => res.send('pong'));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Local dev server only
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📁 Static files: ${path.join(__dirname, '..', 'public')}`);
  });
}

// Export Express app for Vercel serverless function
export default app;
