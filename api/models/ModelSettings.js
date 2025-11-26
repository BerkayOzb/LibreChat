const { logger } = require('@librechat/data-schemas');
const { CacheKeys } = require('librechat-data-provider');
const getLogStores = require('~/cache/getLogStores');
const mongoose = require('mongoose');
const { ModelSettings: ImportedModelSettings } = require('@librechat/data-schemas').createModels(mongoose);

let ModelSettings = ImportedModelSettings;

if (!ModelSettings) {
  const modelSettingsSchema = new mongoose.Schema(
    {
      endpoint: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      provider: {
        type: String,
        required: true,
        trim: true,
        index: true,
      },
      modelDisplayOrder: {
        type: [String],
        default: [],
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    {
      timestamps: true,
      collection: 'model_settings',
    },
  );

  modelSettingsSchema.index({ endpoint: 1, provider: 1 }, { unique: true });

  ModelSettings = mongoose.models.ModelSettings || mongoose.model('ModelSettings', modelSettingsSchema);
}

/**
 * Get model display order for a specific endpoint and provider
 * @param {string} endpoint - The endpoint name (e.g., 'openAI', 'AI Models')
 * @param {string} provider - The provider name (e.g., 'openai', 'anthropic')
 * @returns {Promise<string[]>} Array of model names in display order
 */
const getModelDisplayOrder = async function (endpoint, provider) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = `model_order_${endpoint}_${provider}`;

  try {
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get from database
    const settings = await ModelSettings.findOne({ endpoint, provider }).lean().exec();

    if (settings && settings.modelDisplayOrder && settings.modelDisplayOrder.length > 0) {
      await cache.set(cacheKey, settings.modelDisplayOrder, 3600); // 1 hour cache
      return settings.modelDisplayOrder;
    }

    // Return empty array if not found (no custom order)
    return [];
  } catch (error) {
    logger.error('[getModelDisplayOrder]', error);
    return [];
  }
};

/**
 * Update model display order for a specific endpoint and provider
 * @param {string} endpoint - The endpoint name
 * @param {string} provider - The provider name
 * @param {string[]} modelDisplayOrder - Array of model names in desired order
 * @param {string} userId - User ID who made the change
 * @returns {Promise<Object>} Updated model settings
 */
const updateModelDisplayOrder = async function (endpoint, provider, modelDisplayOrder, userId) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = `model_order_${endpoint}_${provider}`;

  try {
    const updatedSettings = await ModelSettings.findOneAndUpdate(
      { endpoint, provider },
      { endpoint, provider, modelDisplayOrder, updatedBy: userId },
      { upsert: true, new: true },
    );

    // Invalidate cache
    await cache.delete(cacheKey);

    return updatedSettings;
  } catch (error) {
    logger.error('[updateModelDisplayOrder]', error);
    throw error;
  }
};

/**
 * Get all model settings across all endpoints and providers
 * @returns {Promise<Array>} Array of all model settings
 */
const getAllModelSettings = async function () {
  try {
    const settings = await ModelSettings.find({}).lean().exec();
    return settings;
  } catch (error) {
    logger.error('[getAllModelSettings]', error);
    return [];
  }
};

module.exports = {
  getModelDisplayOrder,
  updateModelDisplayOrder,
  getAllModelSettings,
};
