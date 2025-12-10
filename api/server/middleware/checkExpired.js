const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');

/**
 * Middleware to check if user's membership has expired
 * Note: ADMIN and ORG_ADMIN roles are exempt from membership expiration checks
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
const checkExpired = async (req, res, next = () => {}) => {
  try {
    const user = req.user;

    // Skip check if no user is authenticated
    if (!user) {
      return next();
    }

    // Skip check for ADMIN and ORG_ADMIN roles
    if (user.role === SystemRoles.ADMIN || user.role === SystemRoles.ORG_ADMIN) {
      return next();
    }

    // Check if membershipExpiresAt exists and is in the past
    if (user.membershipExpiresAt) {
      const expirationDate = new Date(user.membershipExpiresAt);
      const now = new Date();

      if (expirationDate < now) {
        logger.info(`[checkExpired] User ${user.email} membership has expired at ${expirationDate.toISOString()}`);

        return res.status(403).json({
          message: 'Your membership has expired',
          expired: true,
          expiredAt: user.membershipExpiresAt,
          code: 'MEMBERSHIP_EXPIRED',
        });
      }
    }

    return next();
  } catch (error) {
    logger.error('[checkExpired] Error:', error);
    return next(error);
  }
};

module.exports = checkExpired;
