const express = require('express');
const {
  getAllUsersController,
  createUserController,
  resetUserPasswordController,
  updateUserRoleController,
  updateUserStatusController,
  banUserController,
  deleteUserAdminController,
  getUserByIdController,
} = require('~/server/controllers/AdminController.js');
const {
  getOrganizationUsers,
  createOrganizationUser,
  updateOrganizationUser,
  deleteOrganizationUser,
} = require('~/server/controllers/OrganizationController.js');
const { requireJwtAuth } = require('~/server/middleware');
const { SystemRoles } = require('librechat-data-provider');
const { adminAudit } = require('~/server/middleware/auditLog.js');
const { adminRateLimits } = require('~/server/middleware/adminRateLimit.js');

const router = express.Router();
console.log('Admin Users Route Loaded');

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
router.use(adminRateLimits.general);

/**
 * GET /api/admin/users
 * Get all users with pagination, filtering, and search
 */
router.get('/', adminAudit.viewUsers, (req, res, next) => {
  if (req.user.role === SystemRoles.ORG_ADMIN) {
    return getOrganizationUsers(req, res, next);
  }
  return getAllUsersController(req, res, next);
});

/**
 * GET /api/admin/users/:id
 * Get specific user by ID
 */
router.get('/:id', adminAudit.viewUserDetails, (req, res, next) => {
  // TODO: Add getOrganizationUserById if needed, or rely on client fetching list
  // For now, let's assume getOrganizationUsers covers the list usage.
  // Standard AdminController.getUserByIdController likely not organization aware yet.
  if (req.user.role === SystemRoles.ORG_ADMIN) {
    // Return 404 or implement specific fetch
    return res.status(403).json({ message: 'Not implemented for Org Admin' });
  }
  return getUserByIdController(req, res, next);
});

/**
 * POST /api/admin/users
 * Create new user
 */
router.post('/', adminRateLimits.createUser, adminAudit.createUser, (req, res, next) => {
  if (req.user.role === SystemRoles.ORG_ADMIN) {
    return createOrganizationUser(req, res, next);
  }
  return createUserController(req, res, next);
});

/**
 * PUT /api/admin/users/:id/password
 * Reset user password (admin action)
 */
router.put('/:id/password', adminAudit.updateUserRole, (req, res, next) => {
  if (req.user.role === SystemRoles.ORG_ADMIN) {
    // Not yet implemented for Org Admin specifically (security risk if they can reset any user)
    // updateOrganizationUser handles name/expiration but not password reset yet.
    return res.status(403).json({ message: 'Not allowed for Org Admin' });
  }
  return resetUserPasswordController(req, res, next);
});

/**
 * PUT /api/admin/users/:id/role
 * Update user role
 */
router.put('/:id/role', adminAudit.updateUserRole, (req, res, next) => {
  if (req.user.role === SystemRoles.ORG_ADMIN) {
    return res.status(403).json({ message: 'Org Admin cannot change roles' });
  }
  return updateUserRoleController(req, res, next);
});

/**
 * PUT /api/admin/users/:id/status
 * Update user status (banned/active) - Org Admin effectively "bans" by expiration or separate field?
 * OrganizationController uses updateOrganizationUser for expiration.
 * Standard "ban" field is global banned.
 * Org Admin should NOT ban globally.
 */
router.put('/:id/status', adminAudit.banUser, (req, res, next) => {
  if (req.user.role === SystemRoles.ORG_ADMIN) {
    // Maybe allow them to set expiration instead?
    // Frontend calls this for ban toggle.
    // Let's block for now.
    return res.status(403).json({ message: 'Use expiration to manage access' });
  }
  return updateUserStatusController(req, res, next);
});

/**
 * PUT /api/admin/users/:id/ban
 * Ban or unban user
 */
router.put('/:id/ban', adminAudit.banUser, (req, res, next) => {
  if (req.user.role === SystemRoles.ORG_ADMIN) {
    return res.status(403).json({ message: 'Use expiration to manage access' });
  }
  return banUserController(req, res, next);
});

/**
 * PUT /api/admin/users/:id
 * General user update (Name, Expiration, etc.)
 */
router.put('/:id', adminAudit.updateUserRole, (req, res, next) => {
  if (req.user.role === SystemRoles.ORG_ADMIN) {
    return updateOrganizationUser(req, res, next);
  }
  // For global admin, we might not have a generic update controller bound here yet?
  // AdminController usually splits updates. If needed, we can bind one.
  // For now, return 404 for global admin on this generic route to avoid conflict/errors if not implemented.
  return res.status(404).json({ message: 'Generic update not implemented for global admin' });
});

/**
 * DELETE /api/admin/users/:id
 * Delete user
 */
router.delete('/:id', adminRateLimits.deleteUser, adminAudit.deleteUser, (req, res, next) => {
  if (req.user.role === SystemRoles.ORG_ADMIN) {
    return deleteOrganizationUser(req, res, next);
  }
  return deleteUserAdminController(req, res, next);
});

module.exports = router;