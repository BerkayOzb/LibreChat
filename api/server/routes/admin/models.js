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
  getModelOrder,
  updateModelOrder,
  getAllModelOrderSettings,
} = require('~/server/controllers/AdminModelController');
const { requireJwtAuth, checkAdmin } = require('~/server/middleware');

const router = express.Router();

/**
 * Apply JWT authentication to all routes
 */
router.use(requireJwtAuth);

/**
 * @route GET /api/admin/models/stats
 * @desc Get admin model control statistics
 * @access Admin
 */
router.get('/stats', checkAdmin, getAdminModelStats);

/**
 * @route GET /api/admin/models/all
 * @desc Get all model settings across all endpoints
 * @access Admin
 */
router.get('/all', checkAdmin, getAllModelSettings);

/**
 * @route DELETE /api/admin/models/cache
 * @desc Clear model settings cache
 * @query endpoint - Optional endpoint to clear specific cache
 * @access Admin
 */
router.delete('/cache', checkAdmin, clearCache);

/**
 * @route GET /api/admin/models/:endpoint
 * @desc Get all models for a specific endpoint with their admin status
 * @param endpoint - The endpoint name (openAI, google, anthropic, etc.)
 * @access Admin
 */
router.get('/:endpoint', checkAdmin, getEndpointModels);

/**
 * @route POST /api/admin/models/:endpoint/bulk
 * @desc Bulk update model settings for an endpoint
 * @param endpoint - The endpoint name
 * @body updates - Array of model updates {modelName, isEnabled, reason}
 * @access Admin
 */
router.post('/:endpoint/bulk', checkAdmin, bulkUpdateEndpointModels);

/**
 * @route GET /api/admin/models/provider-order/all
 * @desc Get all provider display order settings
 * @access Admin
 */
router.get('/provider-order/all', checkAdmin, getAllProviderOrderSettings);

/**
 * @route GET /api/admin/models/provider-order/:endpoint
 * @desc Get provider display order for a specific endpoint
 * @param endpoint - The endpoint name
 * @access Public (authenticated users need to see provider order)
 */
router.get('/provider-order/:endpoint', getProviderOrder);

/**
 * @route PUT /api/admin/models/provider-order/:endpoint
 * @desc Update provider display order for an endpoint
 * @param endpoint - The endpoint name
 * @body providerDisplayOrder - Array of provider IDs in desired display order
 * @access Admin
 */
router.put('/provider-order/:endpoint', checkAdmin, updateProviderOrder);

/**
 * @route GET /api/admin/models/model-order/all
 * @desc Get all model order settings
 * @access Admin
 */
router.get('/model-order/all', checkAdmin, getAllModelOrderSettings);

/**
 * @route GET /api/admin/models/model-order/:endpoint/:provider
 * @desc Get model display order for a specific endpoint and provider
 * @param endpoint - The endpoint name
 * @param provider - The provider name
 * @access Public (authenticated users need to see model order)
 */
router.get('/model-order/:endpoint/:provider', getModelOrder);

/**
 * @route PUT /api/admin/models/model-order/:endpoint/:provider
 * @desc Update model display order for an endpoint and provider
 * @param endpoint - The endpoint name
 * @param provider - The provider name
 * @body modelDisplayOrder - Array of model names in desired display order
 * @access Admin
 */
router.put('/model-order/:endpoint/:provider', checkAdmin, updateModelOrder);

/**
 * @route PUT /api/admin/models/:endpoint/:modelName
 * @desc Toggle model visibility for a specific endpoint and model
 * @param endpoint - The endpoint name
 * @param modelName - The model name
 * @body isEnabled - Boolean indicating if model should be enabled
 * @body reason - Optional reason for disabling (required when disabling)
 * @access Admin
 */
router.put('/:endpoint/:modelName', checkAdmin, toggleModelVisibility);

/**
 * @route DELETE /api/admin/models/:endpoint/:modelName
 * @desc Reset model setting to default (delete custom setting)
 * @param endpoint - The endpoint name
 * @param modelName - The model name
 * @access Admin
 */
router.delete('/:endpoint/:modelName', checkAdmin, resetModelSetting);

module.exports = router;