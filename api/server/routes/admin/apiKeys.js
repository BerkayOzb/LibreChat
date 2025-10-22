const express = require('express');
const {
  getAdminApiKeys,
  getAdminApiKeyByEndpoint,
  setAdminApiKeyForEndpoint,
  updateAdminApiKeySettings,
  toggleAdminApiKeyStatus,
  deleteAdminApiKeyForEndpoint,
  checkAdminApiKeyExists,
  clearApiKeysCache,
  getApiKeyStatistics,
} = require('~/server/controllers/AdminApiKeyController');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { checkAdmin } = require('~/server/middleware/roles');

const router = express.Router();

// Apply authentication and admin role middleware to all routes
router.use(requireJwtAuth);
router.use(checkAdmin);

/**
 * @route GET /api/admin/api-keys
 * @desc Get all admin API keys with statistics
 * @access Admin
 */
router.get('/', getAdminApiKeys);

/**
 * @route GET /api/admin/api-keys/stats
 * @desc Get admin API key statistics
 * @access Admin
 */
router.get('/stats', getApiKeyStatistics);

/**
 * @route GET /api/admin/api-keys/:endpoint
 * @desc Get admin API key for specific endpoint
 * @access Admin
 */
router.get('/:endpoint', getAdminApiKeyByEndpoint);

/**
 * @route GET /api/admin/api-keys/:endpoint/exists
 * @desc Check if admin API key exists for endpoint
 * @access Admin
 */
router.get('/:endpoint/exists', checkAdminApiKeyExists);

/**
 * @route POST /api/admin/api-keys/:endpoint
 * @desc Set or create admin API key for endpoint
 * @access Admin
 */
router.post('/:endpoint', setAdminApiKeyForEndpoint);

/**
 * @route PUT /api/admin/api-keys/:endpoint
 * @desc Update admin API key settings (without changing the key)
 * @access Admin
 */
router.put('/:endpoint', updateAdminApiKeySettings);

/**
 * @route PATCH /api/admin/api-keys/:endpoint/toggle
 * @desc Toggle admin API key active status
 * @access Admin
 */
router.patch('/:endpoint/toggle', toggleAdminApiKeyStatus);

/**
 * @route DELETE /api/admin/api-keys/:endpoint
 * @desc Delete admin API key for endpoint
 * @access Admin
 */
router.delete('/:endpoint', deleteAdminApiKeyForEndpoint);

/**
 * @route POST /api/admin/api-keys/cache/clear
 * @desc Clear admin API keys cache
 * @access Admin
 */
router.post('/cache/clear', clearApiKeysCache);

module.exports = router;