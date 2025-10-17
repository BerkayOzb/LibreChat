const express = require('express');
const {
  getAllUsersController,
  createUserController,
  updateUserRoleController,
  banUserController,
  deleteUserAdminController,
  getUserByIdController,
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
 * Query parameters:
 * - page: page number (default: 1)
 * - limit: items per page (default: 10, max: 100)
 * - search: search term for email/username
 * - role: filter by role (USER, ADMIN)
 * - status: filter by status (active, banned)
 * - sortBy: sort field (createdAt, email, username)
 * - sortOrder: asc or desc (default: desc)
 */
router.get('/', adminAudit.viewUsers, getAllUsersController);

/**
 * GET /api/admin/users/:id
 * Get specific user by ID
 */
router.get('/:id', adminAudit.viewUserDetails, getUserByIdController);

/**
 * POST /api/admin/users
 * Create new user
 * Body: { email, password, username?, name?, role? }
 */
router.post('/', adminRateLimits.createUser, adminAudit.createUser, createUserController);

/**
 * PUT /api/admin/users/:id/role
 * Update user role
 * Body: { role: 'USER' | 'ADMIN' }
 */
router.put('/:id/role', adminAudit.updateUserRole, updateUserRoleController);

/**
 * PUT /api/admin/users/:id/ban
 * Ban or unban user
 * Body: { banned: boolean, reason?: string }
 */
router.put('/:id/ban', adminAudit.banUser, banUserController);

/**
 * DELETE /api/admin/users/:id
 * Delete user (admin version with audit logging)
 */
router.delete('/:id', adminRateLimits.deleteUser, adminAudit.deleteUser, deleteUserAdminController);

module.exports = router;