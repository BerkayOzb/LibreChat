const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');
const { generate2FATempToken } = require('~/server/services/twoFactorService');
const { setAuthTokens } = require('~/server/services/AuthService');
const { User } = require('~/db/models');

const loginController = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check if membership has expired (skip for ADMIN and ORG_ADMIN)
    if (req.user.membershipExpiresAt && req.user.role !== SystemRoles.ADMIN && req.user.role !== SystemRoles.ORG_ADMIN) {
      const expirationDate = new Date(req.user.membershipExpiresAt);
      const now = new Date();
      if (expirationDate < now) {
        logger.info(`[loginController] User ${req.user.email} membership has expired at ${expirationDate.toISOString()}`);
        return res.status(403).json({
          message: 'Your membership has expired',
          expired: true,
          expiredAt: req.user.membershipExpiresAt,
          code: 'MEMBERSHIP_EXPIRED',
        });
      }
    }

    if (req.user.twoFactorEnabled) {
      const tempToken = generate2FATempToken(req.user._id);
      return res.status(200).json({ twoFAPending: true, tempToken });
    }

    const { password: _p, totpSecret: _t, __v, ...user } = req.user;
    user.id = user._id.toString();

    try {
      await User.updateOne({ _id: req.user._id }, { $set: { lastLoginAt: new Date() } });
    } catch (err) {
      logger.error('[loginController] Failed to update lastLoginAt', err);
    }

    const token = await setAuthTokens(req.user._id, res);

    return res.status(200).send({ token, user });
  } catch (err) {
    logger.error('[loginController]', err);
    return res.status(500).json({ message: 'Something went wrong' });
  }
};

module.exports = {
  loginController,
};
