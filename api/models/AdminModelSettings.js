const { logger } = require('@librechat/data-schemas');
const { CacheKeys } = require('librechat-data-provider');
const getLogStores = require('~/cache/getLogStores');
const mongoose = require('mongoose');
// Define correct schema locally to ensure all fields exist
const adminModelSettingsSchema = new mongoose.Schema(
  {
    endpoint: {
      type: String,
      required: [true, 'Endpoint name is required'],
      trim: true,
      maxlength: [50, 'Endpoint name cannot exceed 50 characters'],
    },
    modelName: {
      type: String,
      required: [true, 'Model name is required'],
      trim: true,
      maxlength: [100, 'Model name cannot exceed 100 characters'],
    },
    isEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    disabledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    disabledAt: {
      type: Date,
      required: false,
    },
    reason: {
      type: String,
      maxlength: [500, 'Reason cannot exceed 500 characters'],
      trim: true,
    },
    position: {
      type: Number,
      required: false,
      default: 0,
    },
    isDefault: {
      type: Boolean,
      required: false,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'admin_model_settings', // Map to the same collection
  }
);

adminModelSettingsSchema.index({ endpoint: 1, modelName: 1 }, { unique: true });
adminModelSettingsSchema.index({ endpoint: 1 });
adminModelSettingsSchema.index({ modelName: 1 });
adminModelSettingsSchema.index({ isEnabled: 1 });
adminModelSettingsSchema.index({ disabledBy: 1 });
adminModelSettingsSchema.index({ updatedAt: -1 });
adminModelSettingsSchema.index({ position: 1 });

// Use a local model name to avoid conflicts with the package model
let AdminModelSettings;
try {
  AdminModelSettings = mongoose.model('FixedAdminModelSettings');
} catch {
  AdminModelSettings = mongoose.model('FixedAdminModelSettings', adminModelSettingsSchema);
}
const { getAppConfig } = require('~/server/services/Config/app');
const { loadCustomEndpointsConfig } = require('@librechat/api');
const { fetchModels } = require('~/server/services/ModelService');

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
      .sort({ endpoint: 1, position: 1, modelName: 1 })
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
      .sort({ position: 1, modelName: 1 })
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

    if (options.position !== undefined) {
      updateData.position = options.position;
    }

    if (options.isDefault !== undefined) {
      updateData.isDefault = options.isDefault;

      // If setting as default, unset other defaults for this endpoint
      if (options.isDefault) {
        await AdminModelSettings.updateMany(
          { endpoint, modelName: { $ne: modelName } },
          { $set: { isDefault: false } }
        );
      }
    }

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

    logger.info(`[setModelVisibility] ${isEnabled ? 'Enabled' : 'Disabled'} model '${modelName}' for endpoint '${endpoint}' by user ${updatedBy}. Position: ${updateData.position}, Saved: ${setting.position}`);
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
        await setModelVisibility(endpoint, update.modelName, update.isEnabled, {
          reason: update.reason,
          position: update.position,
          isDefault: update.isDefault
        }, updatedBy);
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

    // Get standard endpoints
    const standardEndpoints = [
      EModelEndpoint.openAI,
      EModelEndpoint.anthropic,
      EModelEndpoint.google,
      EModelEndpoint.bedrock,
      EModelEndpoint.azureOpenAI,
      EModelEndpoint.assistants,
      EModelEndpoint.azureAssistants
    ];

    // Get custom endpoints
    let customEndpoints = [];
    let customEndpointsConfig = {};
    let rawCustomConfig = [];
    try {
      const appConfig = await getAppConfig();
      rawCustomConfig = appConfig?.endpoints?.custom || [];
      customEndpointsConfig = loadCustomEndpointsConfig(rawCustomConfig);
      customEndpoints = Object.keys(customEndpointsConfig || {});
    } catch (error) {
      logger.error('[getModelControlStats] Error loading custom endpoints:', error);
      customEndpoints = [];
      customEndpointsConfig = {};
      rawCustomConfig = [];
    }

    // Combine both standard and custom endpoints
    const endpointsToCheck = [...standardEndpoints, ...customEndpoints];

    for (const endpoint of endpointsToCheck) {
      const isCustomEndpoint = customEndpoints.includes(endpoint);
      try {
        let allModels = [];

        // Get models for each endpoint (similar to AdminModelController)
        if (isCustomEndpoint) {
          // For custom endpoints, get models from raw config (before transformation)
          const rawEndpointConfig = rawCustomConfig.find(c => c.name === endpoint);

          // Check if models should be fetched from API
          if (rawEndpointConfig?.models?.fetch) {
            try {
              // Try to get fetched models from cache
              const modelsCache = getLogStores(CacheKeys.MODEL_QUERIES);
              let cachedModels = await modelsCache.get(rawEndpointConfig.baseURL);

              // If cache is empty, fetch from API
              if (!cachedModels || !Array.isArray(cachedModels) || cachedModels.length === 0) {
                logger.info(`[getModelControlStats] Cache empty for ${endpoint}, fetching from API...`);

                try {
                  // Fetch models from API
                  const fetchedModels = await fetchModels({
                    apiKey: rawEndpointConfig.apiKey,
                    baseURL: rawEndpointConfig.baseURL,
                    name: endpoint,
                  });

                  if (fetchedModels && Array.isArray(fetchedModels) && fetchedModels.length > 0) {
                    allModels = fetchedModels;
                    logger.info(`[getModelControlStats] Fetched ${fetchedModels.length} models from API for ${endpoint}`);
                  } else if (rawEndpointConfig.models?.default) {
                    allModels = rawEndpointConfig.models.default;
                    logger.warn(`[getModelControlStats] API returned no models for ${endpoint}, using ${allModels.length} default models`);
                  }
                } catch (fetchError) {
                  logger.error(`[getModelControlStats] API fetch failed for ${endpoint}:`, fetchError);
                  if (rawEndpointConfig.models?.default) {
                    allModels = rawEndpointConfig.models.default;
                    logger.warn(`[getModelControlStats] Using ${allModels.length} default models after fetch failure`);
                  }
                }
              } else {
                allModels = cachedModels;
                logger.info(`[getModelControlStats] Using ${cachedModels.length} cached models for ${endpoint}`);
              }
            } catch (error) {
              logger.error(`[getModelControlStats] Error in model fetch logic for ${endpoint}:`, error);
              // Fallback to default models on error
              if (rawEndpointConfig.models?.default) {
                allModels = rawEndpointConfig.models.default;
              }
            }
          } else if (rawEndpointConfig?.models?.default) {
            // Use default models when fetch is disabled
            allModels = rawEndpointConfig.models.default;
          } else {
            logger.warn(`[getModelControlStats] No models found for ${endpoint}`);
          }
        } else {
          // Standard endpoints
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
        }

        if (allModels.length > 0) {
          totalEndpoints++;
          let enabledCount = 0;
          let disabledCount = 0;
          logger.info(`[getModelControlStats] Adding ${endpoint} to stats with ${allModels.length} models`);

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
        } else {
          logger.warn(`[getModelControlStats] Skipping ${endpoint} - no models (length: ${allModels.length})`);
        }
      } catch (error) {
        logger.error(`[getModelControlStats] Failed to get models for ${endpoint}:`, error.message, error.stack);
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

    const modelsWithStatus = allModels.map(modelName => {
      const setting = settingsMap.get(modelName);
      return {
        modelName,
        isEnabled: setting ? setting.isEnabled : true, // Default to enabled
        reason: setting?.reason,
        disabledBy: setting?.disabledBy,
        disabledAt: setting?.disabledAt,
        position: setting?.position ?? Number.MAX_SAFE_INTEGER,
        isDefault: setting?.isDefault ?? false
      };
    });

    // Sort by position, then by name for consistent ordering
    return modelsWithStatus.sort((a, b) => {
      if (a.position !== b.position) {
        return a.position - b.position;
      }
      return a.modelName.localeCompare(b.modelName);
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
    // Get all settings for this endpoint to determine order and visibility
    const settings = await getModelSettingsForEndpoint(endpoint);
    const settingsMap = new Map(settings.map(s => [s.modelName, s]));

    // Filter out disabled models
    const visibleModels = models.filter(model => {
      const setting = settingsMap.get(model);
      return setting ? setting.isEnabled : true;
    });

    // Sort models based on position
    // Models with explicit position come first, sorted by position
    // Models without position come last, sorted by name
    return visibleModels.sort((a, b) => {
      const settingA = settingsMap.get(a);
      const settingB = settingsMap.get(b);

      // If one is default, it should be at the top (optional, but good for UX)
      if (settingA?.isDefault && !settingB?.isDefault) return -1;
      if (!settingA?.isDefault && settingB?.isDefault) return 1;

      const posA = settingA?.position ?? Number.MAX_SAFE_INTEGER;
      const posB = settingB?.position ?? Number.MAX_SAFE_INTEGER;

      if (posA !== posB) {
        return posA - posB;
      }

      return a.localeCompare(b);
    });
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