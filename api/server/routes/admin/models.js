const express = require('express');
const {
  getEndpointModels,
  toggleModelVisibility,
  bulkUpdateEndpointModels,
  resetModelSetting,
  getAdminModelStats,
  getAllModelSettings,
  clearCache,
  getProviderOrder,
  updateProviderOrder,
  getAllProviderOrderSettings,
} = require('~/server/controllers/AdminModelController');

const router = express.Router();

/**
 * @route GET /api/admin/models/stats
 * @desc Get admin model control statistics
 * @access Admin
 */
router.get('/stats', getAdminModelStats);

/**
 * @route GET /api/admin/models/all
 * @desc Get all model settings across all endpoints
 * @access Admin
 */
router.get('/all', getAllModelSettings);

/**
 * @route DELETE /api/admin/models/cache
 * @desc Clear model settings cache
 * @query endpoint - Optional endpoint to clear specific cache
 * @access Admin
 */
router.delete('/cache', clearCache);

/**
 * @route GET /api/admin/models/:endpoint
 * @desc Get all models for a specific endpoint with their admin status
 * @param endpoint - The endpoint name (openAI, google, anthropic, etc.)
 * @access Admin
 */
router.get('/:endpoint', getEndpointModels);

/**
 * @route POST /api/admin/models/:endpoint/bulk
 * @desc Bulk update model settings for an endpoint
 * @param endpoint - The endpoint name
 * @body updates - Array of model updates {modelName, isEnabled, reason}
 * @access Admin
 */
router.post('/:endpoint/bulk', bulkUpdateEndpointModels);

/**
 * @route GET /api/admin/models/provider-order/all
 * @desc Get all provider display order settings
 * @access Admin
 */
router.get('/provider-order/all', getAllProviderOrderSettings);

/**
 * @route GET /api/admin/models/provider-order/:endpoint
 * @desc Get provider display order for a specific endpoint
 * @param endpoint - The endpoint name
 * @access Admin
 */
router.get('/provider-order/:endpoint', getProviderOrder);

/**
 * @route PUT /api/admin/models/provider-order/:endpoint
 * @desc Update provider display order for an endpoint
 * @param endpoint - The endpoint name
 * @body providerDisplayOrder - Array of provider IDs in desired display order
 * @access Admin
 */
router.put('/provider-order/:endpoint', updateProviderOrder);

/**
 * @route PUT /api/admin/models/:endpoint/:modelName
 * @desc Toggle model visibility for a specific endpoint and model
 * @param endpoint - The endpoint name
 * @param modelName - The model name
 * @body isEnabled - Boolean indicating if model should be enabled
 * @body reason - Optional reason for disabling (required when disabling)
 * @access Admin
 */
router.put('/:endpoint/:modelName', toggleModelVisibility);

/**
 * @route DELETE /api/admin/models/:endpoint/:modelName
 * @desc Reset model setting to default (delete custom setting)
 * @param endpoint - The endpoint name
 * @param modelName - The model name
 * @access Admin
 */
router.delete('/:endpoint/:modelName', resetModelSetting);

module.exports = router;