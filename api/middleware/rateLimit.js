// In-Memory Rate Limiting (Works in local dev; for production use Redis/KV)
const requestCounts = new Map();

function createRateLimiter(options = {}) {
  const { 
    points = 50,           // Max requests per window
    duration = 60000,      // Time window (ms)
    prefix = 'rl',         // Key prefix
    message = 'Too many requests. Please try again later.'
  } = options;

  return (req, res, next) => {
    const key = `${prefix}:${req.ip}`;
    const now = Date.now();

    // Reset if window expired
    let current = requestCounts.get(key);
    if (!current || now > current.resetTime) {
      current = { count: 0, resetTime: now + duration };
    }

    // Increment and store
    current.count++;
    requestCounts.set(key, current);

    const remaining = Math.max(0, points - current.count);
    const resetSeconds = Math.ceil(current.resetTime / 1000);

    // Set headers
    res.set({
      'X-RateLimit-Limit': points,
      'X-RateLimit-Remaining': remaining,
      'X-RateLimit-Reset': resetSeconds,
    });

    // If limit exceeded
    if (current.count > points) {
      const retryAfter = Math.ceil((current.resetTime - now) / 1000);
      res.set('Retry-After', retryAfter);

      return res.status(429).json({
        success: false,
        error: message,
        retryAfter,
        limit: points,
        remaining: 0,
        resetTime: resetSeconds
      });
    }

    next();
  };
}

// Exports for different routes
export const rateLimitCreate = createRateLimiter({
  points: 20,      // 20 URL creations/min
  duration: 60000,
  prefix: 'create',
  message: 'Too many URL shortening requests. Please wait.'
});

export const rateLimitRedirect = createRateLimiter({
  points: 200,     // 200 redirects/min
  duration: 60000,
  prefix: 'redirect',
  message: 'Too many redirect requests. Please wait a moment.'
});

// Optional strict limiter for sensitive endpoints
export const rateLimitStrict = createRateLimiter({
  points: 5,
  duration: 60000,
  prefix: 'strict',
  message: 'Rate limit exceeded. Try again later.'
});
