const express = require('express');
const {
    getOrganizations,
    createOrganization,
    getOrganizationById,
    updateOrganization,
    deleteOrganization,
    assignOrgAdmin,
    getOrganizationUsers
} = require('~/server/controllers/AdminOrganizationController.js');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');
const { adminAudit } = require('~/server/middleware/auditLog.js'); // Assuming generic audit or create new ones? Reusing adminAudit for now safely if generic.

const router = express.Router();

// All routes require strict Global Admin rights
router.use(requireJwtAuth);
router.use(checkAdmin);

/**
 * GET /api/admin/organizations
 * List organizations
 */
router.get('/', getOrganizations);

/**
 * POST /api/admin/organizations
 * Create organization
 */
router.post('/', createOrganization);

/**
 * GET /api/admin/organizations/:id
 * Get organization details
 */
router.get('/:id', getOrganizationById);

/**
 * PUT /api/admin/organizations/:id
 * Update organization
 */
router.put('/:id', updateOrganization);

/**
 * DELETE /api/admin/organizations/:id
 * Delete organization
 */
router.delete('/:id', deleteOrganization);

/**
 * GET /api/admin/organizations/:id/users
 * Get organization users
 */
router.get('/:id/users', getOrganizationUsers);

/**
 * POST /api/admin/organizations/:id/assign-admin
 * Assign a user as ORG_ADMIN for this organization
 */
router.post('/:id/assign-admin', assignOrgAdmin);

module.exports = router;
