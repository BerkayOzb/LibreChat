const express = require('express');
const { getPinnedModels, togglePin } = require('~/server/controllers/UserModelPreferencesController');
const { requireJwtAuth } = require('~/server/middleware');

const router = express.Router();

/**
 * Apply JWT authentication to all routes
 */
router.use(requireJwtAuth);

/**
 * @route GET /api/user-models/pinned/:endpoint/:provider
 * @desc Get user's pinned models for specific endpoint and provider
 * @param endpoint - The endpoint name
 * @param provider - The provider name
 * @access Authenticated users
 */
router.get('/pinned/:endpoint/:provider', getPinnedModels);

/**
 * @route POST /api/user-models/pin/:endpoint/:provider/:modelName
 * @desc Toggle pin status for a model
 * @param endpoint - The endpoint name
 * @param provider - The provider name
 * @param modelName - The model name
 * @access Authenticated users
 */
router.post('/pin/:endpoint/:provider/:modelName', togglePin);

module.exports = router;
