const express = require('express');
const {
  getAllUsersController,
  createUserController,
  updateUserRoleController,
  banUserController,
  deleteUserAdminController,
} = require('~/server/controllers/AdminController.js');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');
const { adminAudit } = require('~/server/middleware/auditLog.js');
const { adminRateLimits } = require('~/server/middleware/adminRateLimit.js');

const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireJwtAuth);
router.use(checkAdmin);
router.use(adminRateLimits.general);

/**
 * GET /api/admin/users
 * Get all users with pagination, filtering, and search
 */
router.get('/', adminAudit.viewUsers, getAllUsersController);

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/', adminRateLimits.createUser, adminAudit.createUser, createUserController);

/**
 * PUT /api/admin/users/:userId/role
 * Update user role
 */
router.put('/:userId/role', adminAudit.updateUserRole, updateUserRoleController);

/**
 * PUT /api/admin/users/:userId/ban
 * Ban or unban user
 */
router.put('/:userId/ban', adminAudit.banUser, banUserController);

/**
 * DELETE /api/admin/users/:userId
 * Delete user
 */
router.delete('/:userId', adminRateLimits.deleteUser, adminAudit.deleteUser, deleteUserAdminController);

module.exports = router;