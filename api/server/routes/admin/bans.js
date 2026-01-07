const express = require('express');
const {
  getAllBans,
  removeBanById,
  removeBansByTarget,
  clearExpiredBans,
  getBanStats,
} = require('~/server/controllers/AdminBanController.js');
const { requireJwtAuth } = require('~/server/middleware');
const { SystemRoles } = require('librechat-data-provider');
const { adminAudit } = require('~/server/middleware/auditLog.js');
const { adminRateLimits } = require('~/server/middleware/adminRateLimit.js');

const router = express.Router();

// Middleware to check for ADMIN role only (not ORG_ADMIN)
const checkAdminOnly = (req, res, next) => {
  if (req.user.role === SystemRoles.ADMIN) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden - Admin access required' });
};

// All ban management routes require authentication and ADMIN role
router.use(requireJwtAuth);
router.use(checkAdminOnly);
router.use(adminRateLimits.general);

/**
 * GET /api/admin/bans
 * Get all ban records with pagination
 */
router.get('/', adminAudit.viewUsers, getAllBans);

/**
 * GET /api/admin/bans/stats
 * Get ban statistics
 */
router.get('/stats', adminAudit.viewUsers, getBanStats);

/**
 * POST /api/admin/bans/clear-expired
 * Clear all expired ban records
 */
router.post('/clear-expired', adminAudit.banUser, clearExpiredBans);

/**
 * DELETE /api/admin/bans/target/:target
 * Remove all ban records for a specific target (user ID or IP)
 */
router.delete('/target/:target', adminAudit.banUser, removeBansByTarget);

/**
 * DELETE /api/admin/bans/:id
 * Remove a specific ban record by MongoDB _id
 */
router.delete('/:id', adminAudit.banUser, removeBanById);

module.exports = router;
