// middleware/rateLimit.js (Updated to handle missing Redis)
import { RateLimiterRedis } from 'rate-limiter-flexible';
import { redis } from '../lib/redis.js';

// Helper to create a rate limiter instance
function buildLimiter({ keyPrefix, points, duration }) {
  if (!redis) {
    console.warn(`Rate limiter ${keyPrefix} disabled: Redis not available`);
    return null;
  }
  
  return new RateLimiterRedis({
    storeClient: redis,
    keyPrefix,
    points,
    duration,
  });
}

// Rate limiter configurations
const createLimiter = buildLimiter({
  keyPrefix: 'rl:create',
  points: 20,
  duration: 60,
});

const redirectLimiter = buildLimiter({
  keyPrefix: 'rl:redirect',
  points: 600,
  duration: 60,
});

// Middleware wrapper for rate limiting
function rateLimitMw(rl) {
  return async (req, res, next) => {
    // If no rate limiter (Redis unavailable), skip rate limiting
    if (!rl) {
      console.warn('Rate limiting skipped: Redis not available');
      return next();
    }

    try {
      const key = req.ip;
      const rateRes = await rl.consume(key, 1);
      res.set({
        'RateLimit-Limit': rl.points,
        'RateLimit-Remaining': rateRes.remainingPoints,
        'RateLimit-Reset': Math.ceil(rateRes.msBeforeNext / 1000),
      });
      next();
    } catch (rej) {
      const retrySecs = Math.ceil(rej.msBeforeNext / 1000);
      res.set({
        'RateLimit-Limit': rl.points,
        'RateLimit-Remaining': 0,
        'RateLimit-Reset': retrySecs,
        'Retry-After': retrySecs,
      });
      return res
        .status(429)
        .json({ success: false, error: 'Too Many Requests' });
    }
  };
}

// Export ready-to-use middlewares
export const rateLimitCreate = rateLimitMw(createLimiter);
export const rateLimitRedirect = rateLimitMw(redirectLimiter);