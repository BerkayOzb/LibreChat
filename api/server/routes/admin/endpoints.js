const express = require('express');
const {
  getEndpointSettings,
  getEndpointSettingById,
  updateEndpointSetting,
  toggleEndpoint,
  cleanupDuplicates,
  reorderEndpoints,
  getEndpointsForRole,
  initializeEndpoints,
  clearCache,
  bulkUpdateEndpoints,
} = require('~/server/controllers/AdminEndpointController');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { checkAdmin } = require('~/server/middleware/roles');

const router = express.Router();

// Apply authentication and admin role middleware to all routes
router.use(requireJwtAuth);
router.use(checkAdmin);

/**
 * @route GET /api/admin/endpoints
 * @desc Get all endpoint settings with statistics
 * @access Admin
 */
router.get('/', getEndpointSettings);

/**
 * @route GET /api/admin/endpoints/role/:role
 * @desc Get enabled endpoints for a specific role
 * @access Admin
 */
router.get('/role/:role', getEndpointsForRole);

/**
 * @route GET /api/admin/endpoints/:endpoint
 * @desc Get single endpoint setting
 * @access Admin
 */
router.get('/:endpoint', getEndpointSettingById);

/**
 * @route PUT /api/admin/endpoints/:endpoint
 * @desc Create or update endpoint setting
 * @access Admin
 */
router.put('/:endpoint', updateEndpointSetting);

/**
 * @route POST /api/admin/endpoints/:endpoint/toggle
 * @desc Toggle endpoint enabled status
 * @access Admin
 */
router.post('/:endpoint/toggle', toggleEndpoint);

/**
 * @route POST /api/admin/endpoints/reorder
 * @desc Update multiple endpoint orders
 * @access Admin
 */
router.post('/reorder', reorderEndpoints);

/**
 * @route POST /api/admin/endpoints/initialize
 * @desc Initialize default endpoint settings
 * @access Admin
 */
router.post('/initialize', initializeEndpoints);

/**
 * @route POST /api/admin/endpoints/bulk
 * @desc Bulk update endpoint settings
 * @access Admin
 */
router.post('/bulk', bulkUpdateEndpoints);

/**
 * @route POST /api/admin/endpoints/cache/clear
 * @desc Clear endpoint settings cache
 * @access Admin
 */
router.post('/cache/clear', clearCache);

/**
 * @route POST /api/admin/endpoints/cleanup
 * @desc Remove duplicate endpoint settings
 * @access Admin
 */
router.post('/cleanup', cleanupDuplicates);

module.exports = router;