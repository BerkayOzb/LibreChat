const { logger } = require('@librechat/data-schemas');
const { CacheKeys } = require('librechat-data-provider');
const getLogStores = require('~/cache/getLogStores');
const mongoose = require('mongoose');
const { ProviderSettings: ImportedProviderSettings } = require('@librechat/data-schemas').createModels(mongoose);

let ProviderSettings = ImportedProviderSettings;

if (!ProviderSettings) {
  const providerSettingsSchema = new mongoose.Schema(
    {
      endpoint: {
        type: String,
        required: [true, 'Endpoint name is required'],
        trim: true,
        unique: true,
        maxlength: [50, 'Endpoint name cannot exceed 50 characters'],
      },
      providerDisplayOrder: {
        type: [String],
        default: ['openai', 'anthropic', 'meta-llama', 'google', 'mistralai', 'qwen'],
        required: false,
      },
      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
      },
    },
    {
      timestamps: true,
      collection: 'provider_settings',
    },
  );

  providerSettingsSchema.index({ endpoint: 1 });
  providerSettingsSchema.index({ updatedAt: -1 });

  ProviderSettings = mongoose.models.ProviderSettings || mongoose.model('ProviderSettings', providerSettingsSchema);
}

/**
 * Get provider display order for a specific endpoint
 * @param {string} endpoint - The endpoint name (e.g., 'AI Models')
 * @returns {Promise<string[]>} Array of provider IDs in display order
 */
const getProviderDisplayOrder = async function (endpoint) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = `provider_order_${endpoint}`;

  try {
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get from database
    const settings = await ProviderSettings.findOne({ endpoint }).lean().exec();

    if (settings && settings.providerDisplayOrder) {
      await cache.set(cacheKey, settings.providerDisplayOrder, 3600); // 1 hour cache
      return settings.providerDisplayOrder;
    }

    // Return default order if not found
    const defaultOrder = ['openai', 'anthropic', 'meta-llama', 'google', 'mistralai', 'qwen'];
    return defaultOrder;
  } catch (error) {
    logger.error('[getProviderDisplayOrder]', error);
    // Return default order on error
    return ['openai', 'anthropic', 'meta-llama', 'google', 'mistralai', 'qwen'];
  }
};

/**
 * Update provider display order for a specific endpoint
 * @param {string} endpoint - The endpoint name
 * @param {string[]} providerDisplayOrder - Array of provider IDs in desired order
 * @param {string} userId - User ID who made the change
 * @returns {Promise<Object>} Updated provider settings
 */
const updateProviderDisplayOrder = async function (endpoint, providerDisplayOrder, userId) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = `provider_order_${endpoint}`;

  try {
    // Update or create the settings
    const settings = await ProviderSettings.findOneAndUpdate(
      { endpoint },
      {
        providerDisplayOrder,
        updatedBy: userId,
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
      }
    ).lean().exec();

    // Clear cache
    await cache.delete(cacheKey);

    logger.info(`[updateProviderDisplayOrder] Updated provider order for ${endpoint}`, {
      order: providerDisplayOrder,
      userId,
    });

    return settings;
  } catch (error) {
    logger.error('[updateProviderDisplayOrder]', error);
    throw new Error(`Failed to update provider display order: ${error.message}`);
  }
};

/**
 * Get all provider settings
 * @returns {Promise<Array>} Array of all provider settings
 */
const getAllProviderSettings = async function () {
  try {
    const settings = await ProviderSettings.find({}).lean().exec();
    return settings;
  } catch (error) {
    logger.error('[getAllProviderSettings]', error);
    throw new Error(`Failed to retrieve provider settings: ${error.message}`);
  }
};

module.exports = {
  getProviderDisplayOrder,
  updateProviderDisplayOrder,
  getAllProviderSettings,
};
