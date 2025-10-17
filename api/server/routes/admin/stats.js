const express = require('express');
const {
  getUserStatsController,
  getActivityStatsController,
  getRegistrationStatsController,
  getSystemOverviewController,
} = require('~/server/controllers/AdminStatsController.js');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');
const { adminAudit } = require('~/server/middleware/auditLog.js');
const { adminRateLimits } = require('~/server/middleware/adminRateLimit.js');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireJwtAuth);
router.use(checkAdmin);
router.use(adminRateLimits.stats);

/**
 * GET /api/admin/stats/users
 * Get user statistics
 * Returns: { totalUsers, activeUsers, bannedUsers, usersByRole, usersByProvider }
 */
router.get('/users', adminAudit.viewStats, getUserStatsController);

/**
 * GET /api/admin/stats/activity
 * Get activity statistics
 * Query parameters:
 * - period: '7d', '30d', '90d', '1y' (default: '30d')
 * Returns: { dailyActiveUsers, conversationCounts, messageCounts }
 */
router.get('/activity', adminAudit.viewStats, getActivityStatsController);

/**
 * GET /api/admin/stats/registrations
 * Get registration statistics
 * Query parameters:
 * - period: '7d', '30d', '90d', '1y' (default: '30d')
 * Returns: { registrationsByDay, registrationsByProvider }
 */
router.get('/registrations', adminAudit.viewStats, getRegistrationStatsController);

/**
 * GET /api/admin/stats/overview
 * Get system overview statistics
 * Returns: combined overview of key metrics
 */
router.get('/overview', adminAudit.viewStats, getSystemOverviewController);

/**
 * GET /api/admin/stats
 * Get default admin statistics (same as overview)
 * Returns: combined overview of key metrics
 */
router.get('/', adminAudit.viewStats, getSystemOverviewController);

module.exports = router;