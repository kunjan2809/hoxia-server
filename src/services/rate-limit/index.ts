// ============================================================================
// IMPORTS
// ============================================================================

// External Libraries
import rateLimit from 'express-rate-limit';

// Constants
import { RateLimitDefaults } from '../../utils/constants/rateLimit.js';

// ============================================================================
// CONSTANTS
// ============================================================================

const authWindowMs =
  Number.parseInt(process.env['RATE_LIMIT_AUTH_WINDOW_MS'] ?? '', 10) || RateLimitDefaults.AUTH_WINDOW_MS;
const authMax = Number.parseInt(process.env['RATE_LIMIT_AUTH_MAX'] ?? '', 10) || RateLimitDefaults.AUTH_MAX;

// ============================================================================
// RATE LIMITERS
// ============================================================================

export const authRateLimiter = rateLimit({
  windowMs: authWindowMs,
  limit: authMax,
  standardHeaders: true,
  legacyHeaders: false,
});

