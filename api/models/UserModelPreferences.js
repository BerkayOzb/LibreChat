const { logger } = require('@librechat/data-schemas');
const { CacheKeys } = require('librechat-data-provider');
const getLogStores = require('~/cache/getLogStores');
const mongoose = require('mongoose');
const { UserModelPreferences } = require('@librechat/data-schemas').createModels(mongoose);

/**
 * Get user's pinned models for a specific endpoint and provider
 * @param {string} userId - User ID
 * @param {string} endpoint - The endpoint name (e.g., 'openAI', 'AI Models')
 * @param {string} provider - The provider name (e.g., 'openai', 'anthropic')
 * @returns {Promise<string[]>} Array of pinned model names
 */
const getUserPinnedModels = async function (userId, endpoint, provider) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = `user_pinned_${userId}_${endpoint}_${provider}`;

  try {
    // Try cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get from database
    const preferences = await UserModelPreferences.findOne({ userId }).lean().exec();

    if (preferences && preferences.pinnedModels) {
      const pinnedForProvider = preferences.pinnedModels
        .filter((pin) => pin.endpoint === endpoint && pin.provider === provider)
        .map((pin) => pin.modelName);

      if (pinnedForProvider.length > 0) {
        await cache.set(cacheKey, pinnedForProvider, 3600); // 1 hour cache
        return pinnedForProvider;
      }
    }

    // Return empty array if no pins found
    return [];
  } catch (error) {
    logger.error('[getUserPinnedModels]', error);
    return [];
  }
};

/**
 * Toggle pin status for a model
 * @param {string} userId - User ID
 * @param {string} endpoint - The endpoint name
 * @param {string} provider - The provider name
 * @param {string} modelName - The model name to pin/unpin
 * @returns {Promise<Object>} Updated preferences with isPinned status
 */
const toggleModelPin = async function (userId, endpoint, provider, modelName) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = `user_pinned_${userId}_${endpoint}_${provider}`;

  try {
    // Find user preferences
    let preferences = await UserModelPreferences.findOne({ userId });

    if (!preferences) {
      // Create new preferences document
      preferences = new UserModelPreferences({
        userId,
        pinnedModels: [
          {
            endpoint,
            provider,
            modelName,
            pinnedAt: new Date(),
          },
        ],
      });
      await preferences.save();
      await cache.delete(cacheKey);
      return { isPinned: true, pinnedModels: [modelName] };
    }

    // Check if model is already pinned
    const existingPinIndex = preferences.pinnedModels.findIndex(
      (pin) =>
        pin.endpoint === endpoint && pin.provider === provider && pin.modelName === modelName,
    );

    if (existingPinIndex !== -1) {
      // Unpin: Remove from array
      preferences.pinnedModels.splice(existingPinIndex, 1);
      await preferences.save();
      await cache.delete(cacheKey);

      const remainingPins = preferences.pinnedModels
        .filter((pin) => pin.endpoint === endpoint && pin.provider === provider)
        .map((pin) => pin.modelName);

      return { isPinned: false, pinnedModels: remainingPins };
    } else {
      // Pin: Add to array
      preferences.pinnedModels.push({
        endpoint,
        provider,
        modelName,
        pinnedAt: new Date(),
      });
      await preferences.save();
      await cache.delete(cacheKey);

      const allPins = preferences.pinnedModels
        .filter((pin) => pin.endpoint === endpoint && pin.provider === provider)
        .map((pin) => pin.modelName);

      return { isPinned: true, pinnedModels: allPins };
    }
  } catch (error) {
    logger.error('[toggleModelPin]', error);
    throw error;
  }
};

/**
 * Get all pinned models for a user across all endpoints
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of all pinned models
 */
const getAllUserPinnedModels = async function (userId) {
  try {
    const preferences = await UserModelPreferences.findOne({ userId }).lean().exec();
    return preferences?.pinnedModels || [];
  } catch (error) {
    logger.error('[getAllUserPinnedModels]', error);
    return [];
  }
};

module.exports = {
  getUserPinnedModels,
  toggleModelPin,
  getAllUserPinnedModels,
};
