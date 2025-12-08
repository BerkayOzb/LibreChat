const express = require('express');
const router = express.Router();
const OrganizationController = require('../controllers/OrganizationController');
const { requireJwtAuth, requireSystemRole } = require('../middleware');
const { SystemRoles } = require('librechat-data-provider');

// Middleware to ensure user is an Org Admin
const requireOrgAdmin = requireSystemRole(SystemRoles.ORG_ADMIN);

router.get('/stats', requireJwtAuth, requireOrgAdmin, OrganizationController.getOrganizationStats);
router.get('/users', requireJwtAuth, requireOrgAdmin, OrganizationController.getOrganizationUsers);
router.put('/users/:userId', requireJwtAuth, requireOrgAdmin, OrganizationController.updateOrganizationUser);

module.exports = router;
