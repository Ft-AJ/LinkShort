import express from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import userRouter from '../routes/user.route.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

if (!process.env.MONGO_URI) {
  throw new Error('Missing required environment variables');
}

let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected && mongoose.connection.readyState === 1) return;

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize: 1,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err; // let Vercel retry
  }
};

// Connect once on cold start
await connectToDatabase();

// Create Express app
const app = express();

// Your exact existing config endpoint
app.get('/config.js', (req, res) => {
  res.type('application/javascript');
  const baseURL = process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
  res.send(`window.API_BASE = "${baseURL}";`);
});

app.set('trust proxy', true);
app.use(express.json({ limit: '16kb' }));
app.use(helmet());
app.use(express.static(path.join(process.cwd(), 'client')));

app.use('/', userRouter);

app.get('/ping', (req, res) => res.send('pong'));

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {   
  console.log(`Active on ${PORT}.`); 
}); 