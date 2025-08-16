// lib/redis.js
import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

let redis = null;

if (process.env.REDIS_URL) {
  redis = new Redis(process.env.REDIS_URL, {
    enableOfflineQueue: false,
    maxRetriesPerRequest: 3,
    retryDelayOnFailover: 100,
    connectTimeout: 10000,
    lazyConnect: false, 
  });

  redis.on('connect', () => console.log('Redis connected'));
  redis.on('error', (err) => {
    console.error('Redis error:', err.message);
  });
} else {
  console.warn('REDIS_URL not found - rate limiting disabled');
}

export { redis };