// middleware/rateLimit.js
import { redis } from '../lib/redis.js';

// Helper function to get client IP
const getClientIP = (req) => {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
         req.headers['x-real-ip'] ||
         req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
};

// In-memory fallback for when Redis is not available
const memoryStore = new Map();
const MEMORY_CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

// Clean up expired entries from memory store
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of memoryStore.entries()) {
    if (data.resetTime <= now) {
      memoryStore.delete(key);
    }
  }
}, MEMORY_CLEANUP_INTERVAL);

// Generic rate limiter function
const rateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes default
    max = 10, // 10 requests per window
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => `rate_limit:${getClientIP(req)}`,
    skipSuccessfulRequests = false,
    skipFailedRequests = false
  } = options;

  return async (req, res, next) => {
    try {
      const key = keyGenerator(req);
      const now = Date.now();
      const windowStart = now - windowMs;

      let currentCount = 0;
      let resetTime = now + windowMs;

      if (redis) {
        // Use Redis for distributed rate limiting
        const multi = redis.multi();
        
        // Remove expired entries
        multi.zremrangebyscore(key, '-inf', windowStart);
        
        // Add current request
        multi.zadd(key, now, `${now}-${Math.random()}`);
        
        // Count requests in current window
        multi.zcard(key);
        
        // Set expiration
        multi.expire(key, Math.ceil(windowMs / 1000));
        
        const results = await multi.exec();
        
        if (results && results[2] && results[2][1] !== null) {
          currentCount = results[2][1];
        }
      } else {
        // Fallback to in-memory store
        const data = memoryStore.get(key) || { count: 0, resetTime: now + windowMs };
        
        // Reset if window has expired
        if (now >= data.resetTime) {
          data.count = 0;
          data.resetTime = now + windowMs;
        }
        
        data.count++;
        currentCount = data.count;
        resetTime = data.resetTime;
        
        memoryStore.set(key, data);
      }

      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': max,
        'X-RateLimit-Remaining': Math.max(0, max - currentCount),
        'X-RateLimit-Reset': new Date(resetTime).toISOString(),
      });

      if (currentCount > max) {
        return res.status(429).json({
          success: false,
          message,
          error: 'Rate limit exceeded',
          retryAfter: Math.ceil((resetTime - now) / 1000)
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiting error:', error);
      // If rate limiting fails, allow the request to continue
      next();
    }
  };
};

// Rate limiter for URL creation (more restrictive)
export const rateLimitCreate = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 URLs per 15 minutes per IP
  message: 'Too many URL creation attempts. Please wait before creating more URLs.',
  keyGenerator: (req) => `create:${getClientIP(req)}`
});

// Rate limiter for redirects (less restrictive)
export const rateLimitRedirect = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 redirects per minute per IP
  message: 'Too many redirect requests. Please slow down.',
  keyGenerator: (req) => `redirect:${getClientIP(req)}`
});

// Rate limiter for getting URL info
export const rateLimitInfo = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 info requests per 5 minutes per IP
  message: 'Too many info requests. Please wait before checking more URLs.',
  keyGenerator: (req) => `info:${getClientIP(req)}`
});