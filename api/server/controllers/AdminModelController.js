const { logger } = require('@librechat/data-schemas');
const { EModelEndpoint } = require('librechat-data-provider');
const {
  getAllAdminModelSettings,
  getModelSettingsForEndpoint,
  setModelVisibility,
  bulkUpdateModels,
  deleteModelSetting,
  getModelControlStats,
  getModelsWithAdminStatus,
  clearModelSettingsCache,
} = require('~/models/AdminModelSettings');
const {
  getAnthropicModels,
  getBedrockModels,
  getOpenAIModels,
  getGoogleModels,
} = require('~/server/services/ModelService');

/**
 * Get all models for a specific endpoint with their admin status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEndpointModels = async (req, res) => {
  try {
    const { endpoint } = req.params;
    
    // Validate endpoint
    if (!Object.values(EModelEndpoint).includes(endpoint)) {
      return res.status(400).json({ 
        error: 'Invalid endpoint', 
        validEndpoints: Object.values(EModelEndpoint) 
      });
    }

    // Get all available models for the endpoint
    let allModels = [];
    try {
      switch (endpoint) {
        case EModelEndpoint.openAI:
          allModels = await getOpenAIModels({ user: req.user?.id || req.user?._id });
          break;
        case EModelEndpoint.anthropic:
          allModels = await getAnthropicModels({ user: req.user?.id || req.user?._id });
          break;
        case EModelEndpoint.google:
          allModels = getGoogleModels();
          break;
        case EModelEndpoint.bedrock:
          allModels = getBedrockModels();
          break;
        case EModelEndpoint.azureOpenAI:
          allModels = await getOpenAIModels({ user: req.user?.id || req.user?._id, azure: true });
          break;
        case EModelEndpoint.assistants:
          allModels = await getOpenAIModels({ assistants: true });
          break;
        case EModelEndpoint.azureAssistants:
          allModels = await getOpenAIModels({ azureAssistants: true });
          break;
        default:
          allModels = [];
      }
    } catch (error) {
      logger.error(`[getEndpointModels] Error fetching models for ${endpoint}:`, error);
      allModels = [];
    }

    // Get models with admin status
    const modelsWithStatus = await getModelsWithAdminStatus(endpoint, allModels);

    res.json({
      endpoint,
      totalModels: allModels.length,
      models: modelsWithStatus
    });
  } catch (error) {
    logger.error('[getEndpointModels]', error);
    res.status(500).json({ 
      error: 'Failed to get endpoint models',
      message: error.message 
    });
  }
};

/**
 * Toggle model visibility for a specific endpoint and model
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const toggleModelVisibility = async (req, res) => {
  try {
    const { endpoint, modelName } = req.params;
    const { isEnabled, reason } = req.body;
    
    // Validate endpoint
    if (!Object.values(EModelEndpoint).includes(endpoint)) {
      return res.status(400).json({ 
        error: 'Invalid endpoint',
        validEndpoints: Object.values(EModelEndpoint) 
      });
    }

    // Validate required fields
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({ error: 'isEnabled field is required and must be boolean' });
    }

    if (!modelName || typeof modelName !== 'string') {
      return res.status(400).json({ error: 'modelName is required and must be a string' });
    }

    const setting = await setModelVisibility(
      endpoint, 
      modelName, 
      isEnabled, 
      { reason }, 
      req.user?.id || req.user?._id
    );

    logger.info(`[toggleModelVisibility] User ${req.user?.id || req.user?._id} ${isEnabled ? 'enabled' : 'disabled'} model '${modelName}' for endpoint '${endpoint}'`);

    res.json({
      success: true,
      setting: {
        _id: setting._id,
        endpoint: setting.endpoint,
        modelName: setting.modelName,
        isEnabled: setting.isEnabled,
        reason: setting.reason,
        disabledBy: setting.disabledBy,
        disabledAt: setting.disabledAt,
        updatedAt: setting.updatedAt
      }
    });
  } catch (error) {
    logger.error('[toggleModelVisibility]', error);
    res.status(500).json({ 
      error: 'Failed to toggle model visibility',
      message: error.message 
    });
  }
};

/**
 * Bulk update models for a specific endpoint
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const bulkUpdateEndpointModels = async (req, res) => {
  try {
    const { endpoint } = req.params;
    const { updates } = req.body;
    
    // Validate endpoint
    if (!Object.values(EModelEndpoint).includes(endpoint)) {
      return res.status(400).json({ 
        error: 'Invalid endpoint',
        validEndpoints: Object.values(EModelEndpoint) 
      });
    }

    // Validate updates array
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ error: 'Updates array is required and must not be empty' });
    }

    // Validate each update
    for (const update of updates) {
      if (!update.modelName || typeof update.modelName !== 'string') {
        return res.status(400).json({ error: 'Each update must have a valid modelName' });
      }
      if (typeof update.isEnabled !== 'boolean') {
        return res.status(400).json({ error: 'Each update must have a boolean isEnabled field' });
      }
    }

    const result = await bulkUpdateModels(endpoint, updates, req.user?.id || req.user?._id);

    logger.info(`[bulkUpdateEndpointModels] User ${req.user?.id || req.user?._id} bulk updated ${updates.length} models for endpoint '${endpoint}': ${result.success} success, ${result.failed} failed`);

    res.json({
      success: true,
      result: {
        endpoint,
        totalUpdates: updates.length,
        successful: result.success,
        failed: result.failed,
        errors: result.errors
      }
    });
  } catch (error) {
    logger.error('[bulkUpdateEndpointModels]', error);
    res.status(500).json({ 
      error: 'Failed to bulk update models',
      message: error.message 
    });
  }
};

/**
 * Reset model setting to default (delete custom setting)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resetModelSetting = async (req, res) => {
  try {
    const { endpoint, modelName } = req.params;
    
    // Validate endpoint
    if (!Object.values(EModelEndpoint).includes(endpoint)) {
      return res.status(400).json({ 
        error: 'Invalid endpoint',
        validEndpoints: Object.values(EModelEndpoint) 
      });
    }

    if (!modelName || typeof modelName !== 'string') {
      return res.status(400).json({ error: 'modelName is required and must be a string' });
    }

    const deleted = await deleteModelSetting(endpoint, modelName, req.user?.id || req.user?._id);

    if (deleted) {
      logger.info(`[resetModelSetting] User ${req.user?.id || req.user?._id} reset model setting for '${modelName}' in endpoint '${endpoint}'`);
      res.json({ 
        success: true, 
        message: 'Model setting reset to default (enabled)' 
      });
    } else {
      res.json({ 
        success: true, 
        message: 'No custom setting found, model already uses default setting' 
      });
    }
  } catch (error) {
    logger.error('[resetModelSetting]', error);
    res.status(500).json({ 
      error: 'Failed to reset model setting',
      message: error.message 
    });
  }
};

/**
 * Get admin model control statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAdminModelStats = async (req, res) => {
  try {
    const stats = await getModelControlStats();
    
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    logger.error('[getAdminModelStats]', error);
    res.status(500).json({ 
      error: 'Failed to get model control statistics',
      message: error.message 
    });
  }
};

/**
 * Get all model settings across all endpoints
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAllModelSettings = async (req, res) => {
  try {
    const settings = await getAllAdminModelSettings();
    
    res.json({
      success: true,
      total: settings.length,
      settings
    });
  } catch (error) {
    logger.error('[getAllModelSettings]', error);
    res.status(500).json({ 
      error: 'Failed to get all model settings',
      message: error.message 
    });
  }
};

/**
 * Clear model settings cache
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const clearCache = async (req, res) => {
  try {
    const { endpoint } = req.query;
    
    const cleared = await clearModelSettingsCache(endpoint || null);
    
    if (cleared) {
      logger.info(`[clearCache] User ${req.user?.id || req.user?._id} cleared model settings cache${endpoint ? ` for endpoint ${endpoint}` : ''}`);
      res.json({ 
        success: true, 
        message: `Cache cleared${endpoint ? ` for endpoint ${endpoint}` : ' for all endpoints'}` 
      });
    } else {
      res.status(500).json({ 
        error: 'Failed to clear cache' 
      });
    }
  } catch (error) {
    logger.error('[clearCache]', error);
    res.status(500).json({ 
      error: 'Failed to clear cache',
      message: error.message 
    });
  }
};

module.exports = {
  getEndpointModels,
  toggleModelVisibility,
  bulkUpdateEndpointModels,
  resetModelSetting,
  getAdminModelStats,
  getAllModelSettings,
  clearCache,
};