const rateLimit = require('express-rate-limit');
const { logger } = require('@librechat/data-schemas');

/**
 * Rate limiting configuration for admin operations
 */
const createAdminRateLimit = (options = {}) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100, // limit each IP to 100 requests per windowMs
    message = 'Too many admin requests from this IP, please try again later',
    keyPrefix = 'admin_rl_',
  } = options;

  return rateLimit({
    windowMs,
    max,
    message: { message },
    keyGenerator: (req) => {
      // Use both IP and user ID for rate limiting
      return `${keyPrefix}${req.ip}_${req.user?.id || 'anonymous'}`;
    },
    handler: (req, res, next, options) => {
      logger.warn(`[ADMIN_RATE_LIMIT] Rate limit exceeded`, {
        ip: req.ip,
        userId: req.user?.id,
        userEmail: req.user?.email,
        url: req.originalUrl,
        userAgent: req.get('User-Agent'),
      });
      res.status(429).json({ 
        message: typeof options.message === 'string' ? options.message : options.message.message,
        error: 'Too Many Requests',
        retryAfter: Math.round(options.windowMs / 1000)
      });
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  });
};

/**
 * Specific rate limiters for different admin operations
 */
const adminRateLimits = {
  // General admin operations
  general: createAdminRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    keyPrefix: 'admin_general_',
  }),

  // User creation (more restrictive)
  createUser: createAdminRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // 10 user creations per hour
    keyPrefix: 'admin_create_user_',
    message: 'Too many user creation attempts, please try again later',
  }),

  // User deletion (very restrictive)
  deleteUser: createAdminRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // 5 user deletions per hour
    keyPrefix: 'admin_delete_user_',
    message: 'Too many user deletion attempts, please try again later',
  }),

  // Bulk operations
  bulkOperations: createAdminRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 bulk operations per hour
    keyPrefix: 'admin_bulk_',
    message: 'Too many bulk operations, please try again later',
  }),

  // Statistics viewing
  stats: createAdminRateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 50, // 50 stats requests per 5 minutes
    keyPrefix: 'admin_stats_',
  }),
};

module.exports = {
  createAdminRateLimit,
  adminRateLimits,
};