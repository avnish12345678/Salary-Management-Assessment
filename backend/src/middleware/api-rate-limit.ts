import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/** General API rate limit for authenticated traffic (login has a stricter limiter). */
export const apiRateLimiter = rateLimit({
  windowMs: 60_000,
  max: env.NODE_ENV === 'production' ? 300 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    data: null,
    error: {
      message: 'Too many requests. Please slow down.',
      details: null,
    },
    meta: null,
  },
});
