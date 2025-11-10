const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { getUserById, updateUser } = require('~/models');

// JWT strategy
const jwtLogin = () =>
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
    },
    async (payload, done) => {
      try {
        const user = await getUserById(payload?.id, '-password -__v -totpSecret -backupCodes +banned');
        if (!user) {
          logger.warn('[jwtLogin] JwtStrategy => no user found: ' + payload?.id);
          return done(null, false);
        }

        // Check if user is banned (banned === true or undefined means user needs approval/is disabled)
        if (user.banned === true || user.banned === undefined) {
          logger.warn('[jwtLogin] JwtStrategy => banned user attempted access: ' + payload?.id);
          return done(null, false, { message: 'Account is pending admin approval or has been disabled.' });
        }

        user.id = user._id.toString();
        if (!user.role) {
          user.role = SystemRoles.USER;
          await updateUser(user.id, { role: user.role });
        }
        done(null, user);
      } catch (err) {
        done(err, false);
      }
    },
  );

module.exports = jwtLogin;
