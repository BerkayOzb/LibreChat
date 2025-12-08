const express = require('express');
const {
  getUserStatsController,
  getActivityStatsController,
  getRegistrationStatsController,
  getSystemOverviewController,
} = require('~/server/controllers/AdminStatsController.js');
const {
  getOrganizationStats,
} = require('~/server/controllers/OrganizationController.js');
const { requireJwtAuth } = require('~/server/middleware');
const { SystemRoles } = require('librechat-data-provider');
const { adminAudit } = require('~/server/middleware/auditLog.js');
const { adminRateLimits } = require('~/server/middleware/adminRateLimit.js');

const router = express.Router();

// Middleware to check for ADMIN or ORG_ADMIN role
const checkAccess = (req, res, next) => {
  if (req.user.role === SystemRoles.ADMIN || req.user.role === SystemRoles.ORG_ADMIN) {
    return next();
  }
  return res.status(403).json({ message: 'Forbidden' });
};

// All admin routes require authentication and valid role
router.use(requireJwtAuth);
router.use(checkAccess);
router.use(adminRateLimits.stats);

/**
 * GET /api/admin/stats/users
 * Get user statistics
 */
router.get('/users', adminAudit.viewStats, (req, res, next) => {
  if (req.user.role === SystemRoles.ORG_ADMIN) {
    // OrganizationStats returns a combined object.
    // AdminStats frontend expects specific structure from userStats.
    // We might need to mock or map it here, or just basic stats.
    // For now, let's redirect to overall organization stats which contains user counts.
    return getOrganizationStats(req, res, next);
  }
  return getUserStatsController(req, res, next);
});

/**
 * GET /api/admin/stats/activity
 * Get activity statistics
 */
router.get('/activity', adminAudit.viewStats, getActivityStatsController);

/**
 * GET /api/admin/stats/registrations
 * Get registration statistics
 */
router.get('/registrations', adminAudit.viewStats, getRegistrationStatsController);

/**
 * GET /api/admin/stats/overview
 * Get system overview statistics
 */
router.get('/overview', adminAudit.viewStats, (req, res, next) => {
  if (req.user.role === SystemRoles.ORG_ADMIN) {
    return getOrganizationStats(req, res, next);
  }
  return getSystemOverviewController(req, res, next);
});

/**
 * GET /api/admin/stats
 * Get default admin statistics (same as overview)
 */
router.get('/', adminAudit.viewStats, (req, res, next) => {
  if (req.user.role === SystemRoles.ORG_ADMIN) {
    return getOrganizationStats(req, res, next);
  }
  return getSystemOverviewController(req, res, next);
});

module.exports = router;