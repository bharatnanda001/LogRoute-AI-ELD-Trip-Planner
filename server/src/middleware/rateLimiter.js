// server/src/middleware/rateLimiter.js
// Configurable rate limiting per endpoint using express-rate-limit
import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // login attempts per window
  message: { error: 'Too many login attempts, please try again later.' },
});

export const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many refresh attempts, please try again later.' },
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'AI endpoint rate limit exceeded.' },
});

export const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: 'Sync/GPS endpoint rate limit exceeded.' },
});
