/**
 * ========================================
 * RATE LIMITER MIDDLEWARE
 * ========================================
 */

import rateLimit from 'express-rate-limit';
import { config } from '../config';

export const rateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: {
    status: 'error',
    message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
