const { logger } = require('@librechat/data-schemas');

/**
 * Middleware factory to check for a specific system role.
 * @param {string} role - The SystemRole to check for.
 */
function requireSystemRole(role) {
    return function (req, res, next) {
        try {
            if (!req.user || req.user.role !== role) {
                return res.status(403).json({ message: 'Forbidden' });
            }
            next();
        } catch (error) {
            logger.error(`[requireSystemRole] Error checking role ${role}`, error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    };
}

module.exports = requireSystemRole;
