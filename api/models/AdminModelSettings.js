const { logger } = require('@librechat/data-schemas');
const { CacheKeys } = require('librechat-data-provider');
const getLogStores = require('~/cache/getLogStores');
const mongoose = require('mongoose');
const { AdminModelSettings } = require('@librechat/data-schemas').createModels(mongoose);

/**
 * Get all admin model settings
 * @returns {Promise<AdminModelSettings[]>} Array of admin model settings
 */
const getAllAdminModelSettings = async function () {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = 'admin_model_settings';
  
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const settings = await AdminModelSettings.find({})
      .sort({ endpoint: 1, modelName: 1 })
      .lean()
      .exec();

    await cache.set(cacheKey, settings, 300); // 5 minutes cache
    return settings;
  } catch (error) {
    logger.error('[getAllAdminModelSettings]', error);
    throw new Error(`Failed to retrieve admin model settings: ${error.message}`);
  }
};

/**
 * Get disabled models for a specific endpoint
 * @param {string} endpoint - The endpoint name
 * @returns {Promise<string[]>} Array of disabled model names
 */
const getDisabledModelsForEndpoint = async function (endpoint) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = `disabled_models_${endpoint}`;
  
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const disabledSettings = await AdminModelSettings.find({ 
      endpoint, 
      isEnabled: false 
    })
      .select('modelName')
      .lean()
      .exec();

    const disabledModels = disabledSettings.map(setting => setting.modelName);
    await cache.set(cacheKey, disabledModels, 300); // 5 minutes cache
    return disabledModels;
  } catch (error) {
    logger.error('[getDisabledModelsForEndpoint]', error);
    throw new Error(`Failed to retrieve disabled models for endpoint: ${error.message}`);
  }
};

/**
 * Get model settings for a specific endpoint
 * @param {string} endpoint - The endpoint name
 * @returns {Promise<AdminModelSettings[]>} Array of model settings for the endpoint
 */
const getModelSettingsForEndpoint = async function (endpoint) {
  try {
    const settings = await AdminModelSettings.find({ endpoint })
      .sort({ modelName: 1 })
      .lean()
      .exec();
    
    return settings;
  } catch (error) {
    logger.error('[getModelSettingsForEndpoint]', error);
    throw new Error(`Failed to retrieve model settings for endpoint: ${error.message}`);
  }
};

/**
 * Set model visibility for a specific endpoint and model
 * @param {string} endpoint - The endpoint name
 * @param {string} modelName - The model name
 * @param {boolean} isEnabled - Whether the model is enabled
 * @param {Object} options - Additional options
 * @param {string} options.reason - Optional reason for disabling
 * @param {string} updatedBy - User ID who made the change
 * @returns {Promise<AdminModelSettings>} Created or updated model setting
 */
const setModelVisibility = async function (endpoint, modelName, isEnabled, options = {}, updatedBy) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  
  try {
    const { reason } = options;
    
    const updateData = {
      isEnabled,
      reason: isEnabled ? undefined : reason, // Clear reason when enabling
    };

    // Set disabledBy and disabledAt when disabling
    if (!isEnabled) {
      updateData.disabledBy = updatedBy;
      updateData.disabledAt = new Date();
    }

    const setting = await AdminModelSettings.findOneAndUpdate(
      { endpoint, modelName },
      { 
        $set: updateData,
        $setOnInsert: { endpoint, modelName }
      },
      { 
        new: true, 
        upsert: true,
        lean: true,
        setDefaultsOnInsert: true
      }
    ).exec();

    // Clear related caches
    await clearModelSettingsCache(endpoint);
    
    logger.info(`[setModelVisibility] ${isEnabled ? 'Enabled' : 'Disabled'} model '${modelName}' for endpoint '${endpoint}' by user ${updatedBy}`);
    return setting;
  } catch (error) {
    logger.error('[setModelVisibility]', error);
    throw new Error(`Failed to set model visibility: ${error.message}`);
  }
};

/**
 * Bulk update model settings for an endpoint
 * @param {string} endpoint - The endpoint name
 * @param {Array} updates - Array of model updates {modelName, isEnabled, reason}
 * @param {string} updatedBy - User ID who made the changes
 * @returns {Promise<Object>} Bulk update result
 */
const bulkUpdateModels = async function (endpoint, updates, updatedBy) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  
  try {
    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    for (const update of updates) {
      try {
        await setModelVisibility(endpoint, update.modelName, update.isEnabled, { reason: update.reason }, updatedBy);
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          modelName: update.modelName,
          error: error.message
        });
        logger.error(`[bulkUpdateModels] Failed to update model ${update.modelName}:`, error);
      }
    }

    // Clear related caches
    await clearModelSettingsCache(endpoint);
    
    logger.info(`[bulkUpdateModels] Bulk updated models for endpoint '${endpoint}': ${results.success} success, ${results.failed} failed`);
    return results;
  } catch (error) {
    logger.error('[bulkUpdateModels]', error);
    throw new Error(`Failed to bulk update models: ${error.message}`);
  }
};

/**
 * Delete model setting (reset to default enabled state)
 * @param {string} endpoint - The endpoint name
 * @param {string} modelName - The model name
 * @param {string} deletedBy - User ID who deleted the setting
 * @returns {Promise<boolean>} Success status
 */
const deleteModelSetting = async function (endpoint, modelName, deletedBy) {
  try {
    const result = await AdminModelSettings.findOneAndDelete({ endpoint, modelName }).exec();
    
    if (result) {
      // Clear related caches
      await clearModelSettingsCache(endpoint);
      
      logger.info(`[deleteModelSetting] Deleted model setting for '${modelName}' in endpoint '${endpoint}' by user ${deletedBy}`);
    }
    
    return !!result;
  } catch (error) {
    logger.error('[deleteModelSetting]', error);
    throw new Error(`Failed to delete model setting: ${error.message}`);
  }
};

/**
 * Check if a model is enabled for an endpoint
 * @param {string} endpoint - The endpoint name
 * @param {string} modelName - The model name
 * @returns {Promise<boolean>} Whether the model is enabled (default true if no setting exists)
 */
const isModelEnabled = async function (endpoint, modelName) {
  try {
    const setting = await AdminModelSettings.findOne({ 
      endpoint, 
      modelName 
    }).select('isEnabled').lean().exec();
    
    // Default to enabled if no setting exists
    return setting ? setting.isEnabled : true;
  } catch (error) {
    logger.error('[isModelEnabled]', error);
    return true; // Default to enabled on error
  }
};

/**
 * Get model control statistics by counting all available models
 * @returns {Promise<Object>} Statistics object
 */
const getModelControlStats = async function () {
  try {
    const { EModelEndpoint } = require('librechat-data-provider');
    const {
      getAnthropicModels,
      getBedrockModels,
      getOpenAIModels,
      getGoogleModels,
    } = require('~/server/services/ModelService');
    
    const endpointStats = {};
    let totalEnabled = 0;
    let totalDisabled = 0;
    let totalModels = 0;
    let totalEndpoints = 0;

    // Get admin settings once
    const settings = await getAllAdminModelSettings();
    const settingsMap = new Map(settings.map(s => [`${s.endpoint}:${s.modelName}`, s]));

    // Count models for each endpoint
    const endpointsToCheck = [
      EModelEndpoint.openAI,
      EModelEndpoint.anthropic,
      EModelEndpoint.google,
      EModelEndpoint.bedrock,
      EModelEndpoint.azureOpenAI,
      EModelEndpoint.assistants,
      EModelEndpoint.azureAssistants
    ];

    for (const endpoint of endpointsToCheck) {
      try {
        let allModels = [];
        
        // Get models for each endpoint (similar to AdminModelController)
        switch (endpoint) {
          case EModelEndpoint.openAI:
            // Use a dummy user ID since we just need model count
            allModels = await getOpenAIModels({ user: 'stats' }).catch(() => []);
            break;
          case EModelEndpoint.anthropic:
            allModels = await getAnthropicModels({ user: 'stats' }).catch(() => []);
            break;
          case EModelEndpoint.google:
            allModels = getGoogleModels();
            break;
          case EModelEndpoint.bedrock:
            allModels = getBedrockModels();
            break;
          case EModelEndpoint.azureOpenAI:
            allModels = await getOpenAIModels({ user: 'stats', azure: true }).catch(() => []);
            break;
          case EModelEndpoint.assistants:
            allModels = await getOpenAIModels({ assistants: true }).catch(() => []);
            break;
          case EModelEndpoint.azureAssistants:
            allModels = await getOpenAIModels({ azureAssistants: true }).catch(() => []);
            break;
          default:
            continue;
        }

        if (allModels.length > 0) {
          totalEndpoints++;
          let enabledCount = 0;
          let disabledCount = 0;

          // Count enabled/disabled models for this endpoint
          allModels.forEach(modelName => {
            const setting = settingsMap.get(`${endpoint}:${modelName}`);
            if (setting && !setting.isEnabled) {
              disabledCount++;
              totalDisabled++;
            } else {
              enabledCount++;
              totalEnabled++;
            }
          });

          totalModels += allModels.length;

          endpointStats[endpoint] = {
            endpoint,
            totalModels: allModels.length,
            enabledModels: enabledCount,
            disabledModels: disabledCount
          };
        }
      } catch (error) {
        logger.warn(`[getModelControlStats] Failed to get models for ${endpoint}:`, error.message);
        // Continue with other endpoints
      }
    }

    return {
      totalEndpoints,
      totalModels,
      totalEnabled,
      totalDisabled,
      endpointStats: Object.values(endpointStats)
    };
  } catch (error) {
    logger.error('[getModelControlStats]', error);
    throw new Error(`Failed to get model control statistics: ${error.message}`);
  }
};

/**
 * Get models with their admin status for an endpoint
 * @param {string} endpoint - The endpoint name
 * @param {Array<string>} allModels - All available models for the endpoint
 * @returns {Promise<Array>} Array of models with admin status
 */
const getModelsWithAdminStatus = async function (endpoint, allModels) {
  try {
    const settings = await getModelSettingsForEndpoint(endpoint);
    const settingsMap = new Map(settings.map(s => [s.modelName, s]));
    
    return allModels.map(modelName => {
      const setting = settingsMap.get(modelName);
      return {
        modelName,
        isEnabled: setting ? setting.isEnabled : true, // Default to enabled
        reason: setting?.reason,
        disabledBy: setting?.disabledBy,
        disabledAt: setting?.disabledAt
      };
    });
  } catch (error) {
    logger.error('[getModelsWithAdminStatus]', error);
    throw new Error(`Failed to get models with admin status: ${error.message}`);
  }
};

/**
 * Clear model settings cache
 * @param {string} endpoint - Optional endpoint to clear specific cache
 * @returns {Promise<boolean>} Success status
 */
const clearModelSettingsCache = async function (endpoint = null) {
  try {
    const cache = getLogStores(CacheKeys.CONFIG_STORE);
    
    // Clear general cache
    await cache.delete('admin_model_settings');
    
    // Clear endpoint-specific cache if provided
    if (endpoint) {
      await cache.delete(`disabled_models_${endpoint}`);
    }
    
    // Clear model-related caches to force refresh
    await cache.delete(CacheKeys.CONFIG);
    await cache.delete(`${CacheKeys.CONFIG}_USER`);
    await cache.delete(`${CacheKeys.CONFIG}_ADMIN`);
    
    return true;
  } catch (error) {
    logger.error('[clearModelSettingsCache]', error);
    return false;
  }
};

/**
 * Filter models based on admin settings for non-admin users
 * @param {string} endpoint - The endpoint name
 * @param {Array<string>} models - Array of model names to filter
 * @param {boolean} isAdmin - Whether the user is an admin
 * @returns {Promise<Array<string>>} Filtered array of model names
 */
const filterModelsForUser = async function (endpoint, models, isAdmin = false) {
  try {
    // Admins see all models
    if (isAdmin) {
      return models;
    }
    
    const disabledModels = await getDisabledModelsForEndpoint(endpoint);
    return models.filter(model => !disabledModels.includes(model));
  } catch (error) {
    logger.error('[filterModelsForUser]', error);
    // Return all models on error to avoid breaking functionality
    return models;
  }
};

module.exports = {
  getAllAdminModelSettings,
  getDisabledModelsForEndpoint,
  getModelSettingsForEndpoint,
  setModelVisibility,
  bulkUpdateModels,
  deleteModelSetting,
  isModelEnabled,
  getModelControlStats,
  getModelsWithAdminStatus,
  clearModelSettingsCache,
  filterModelsForUser,
};