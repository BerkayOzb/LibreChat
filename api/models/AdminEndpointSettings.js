const { logger } = require('@librechat/data-schemas');
const { CacheKeys } = require('librechat-data-provider');
const getLogStores = require('~/cache/getLogStores');
const mongoose = require('mongoose');
const { AdminEndpointSettings } = require('@librechat/data-schemas').createModels(mongoose);

/**
 * Get all endpoint settings
 * @returns {Promise<AdminEndpointSettings[]>} Array of endpoint settings
 */
const getAllEndpointSettings = async function () {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = 'admin_endpoint_settings';
  
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    let settings = await AdminEndpointSettings.find({})
      .sort({ order: 1, endpoint: 1 })
      .lean()
      .exec();

    // Always check for missing endpoints and auto-initialize them
    try {
      // Get available endpoints from config
      const { getEndpointsConfig } = require('~/server/services/Config');
      // Pass ADMIN role to avoid circular dependency with getEnabledEndpointsForRole
      const endpointsConfig = await getEndpointsConfig({ user: { role: 'ADMIN' } });

      if (endpointsConfig && typeof endpointsConfig === 'object') {
        const availableEndpoints = Object.keys(endpointsConfig);
        const existingEndpoints = settings.map(s => s.endpoint);
        const missingEndpoints = availableEndpoints.filter(ep => !existingEndpoints.includes(ep));

        if (missingEndpoints.length > 0) {
          await initializeDefaultEndpointSettings(missingEndpoints);

          // Fetch settings again after initialization
          settings = await AdminEndpointSettings.find({})
            .sort({ order: 1, endpoint: 1 })
            .lean()
            .exec();
        }
      }
    } catch (initError) {
      logger.warn('[getAllEndpointSettings] Failed to auto-initialize missing endpoints:', initError.message);
    }

    await cache.set(cacheKey, settings, 300); // 5 minutes cache
    return settings;
  } catch (error) {
    logger.error('[getAllEndpointSettings]', error);
    throw new Error(`Failed to retrieve endpoint settings: ${error.message}`);
  }
};

/**
 * Get endpoint setting by endpoint name
 * @param {string} endpoint - The endpoint name
 * @returns {Promise<AdminEndpointSettings|null>} Endpoint setting or null
 */
const getEndpointSetting = async function (endpoint) {
  try {
    const setting = await AdminEndpointSettings.findOne({ endpoint })
      .lean()
      .exec();
    
    return setting;
  } catch (error) {
    logger.error('[getEndpointSetting]', error);
    throw new Error(`Failed to retrieve endpoint setting: ${error.message}`);
  }
};

/**
 * Create or update endpoint setting
 * @param {string} endpoint - The endpoint name
 * @param {Object} settingData - The setting data
 * @param {string} updatedBy - User ID who made the update
 * @returns {Promise<AdminEndpointSettings>} Created or updated endpoint setting
 */
const upsertEndpointSetting = async function (endpoint, settingData, updatedBy) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = 'admin_endpoint_settings';
  
  try {
    const updateData = {
      ...settingData,
      updatedBy,
      updatedAt: new Date(),
    };

    const setting = await AdminEndpointSettings.findOneAndUpdate(
      { endpoint },
      { $set: updateData },
      { 
        new: true, 
        upsert: true,
        lean: true,
        setDefaultsOnInsert: true
      }
    ).exec();

    // Clear all related caches to force refresh
    await cache.delete(cacheKey);
    await cache.delete(CacheKeys.ENDPOINT_CONFIG); // Clear base endpoint config cache
    await cache.delete(`${CacheKeys.ENDPOINT_CONFIG}_USER`); // Clear USER role cache
    await cache.delete(`${CacheKeys.ENDPOINT_CONFIG}_ADMIN`); // Clear ADMIN role cache
    await cache.delete(CacheKeys.CONFIG); // Clear app config cache
    
    logger.info(`[upsertEndpointSetting] Updated endpoint '${endpoint}' settings by user ${updatedBy}`);
    return setting;
  } catch (error) {
    logger.error('[upsertEndpointSetting]', error);
    throw new Error(`Failed to update endpoint setting: ${error.message}`);
  }
};

/**
 * Toggle endpoint enabled/disabled status
 * @param {string} endpoint - The endpoint name
 * @param {boolean} enabled - The enabled status
 * @param {string} updatedBy - User ID who made the update
 * @returns {Promise<AdminEndpointSettings>} Updated endpoint setting
 */
const toggleEndpointStatus = async function (endpoint, enabled, updatedBy) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = 'admin_endpoint_settings';
  
  try {
    const setting = await AdminEndpointSettings.findOneAndUpdate(
      { endpoint },
      { 
        $set: { 
          enabled, 
          updatedBy, 
          updatedAt: new Date() 
        } 
      },
      { 
        new: true, 
        upsert: true,
        lean: true,
        setDefaultsOnInsert: true
      }
    ).exec();

    // Clear all related caches to force refresh
    await cache.delete(cacheKey);
    await cache.delete(CacheKeys.ENDPOINT_CONFIG); // Clear base endpoint config cache
    await cache.delete(`${CacheKeys.ENDPOINT_CONFIG}_USER`); // Clear USER role cache
    await cache.delete(`${CacheKeys.ENDPOINT_CONFIG}_ADMIN`); // Clear ADMIN role cache
    await cache.delete(CacheKeys.CONFIG); // Clear app config cache
    
    logger.info(`[toggleEndpointStatus] ${enabled ? 'Enabled' : 'Disabled'} endpoint '${endpoint}' by user ${updatedBy}`);
    return setting;
  } catch (error) {
    logger.error('[toggleEndpointStatus]', error);
    throw new Error(`Failed to toggle endpoint status: ${error.message}`);
  }
};

/**
 * Update multiple endpoint orders
 * @param {Array<{endpoint: string, order: number}>} orderUpdates - Array of endpoint order updates
 * @param {string} updatedBy - User ID who made the update
 * @returns {Promise<number>} Number of updated endpoints
 */
const updateEndpointOrders = async function (orderUpdates, updatedBy) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = 'admin_endpoint_settings';
  
  try {
    let updatedCount = 0;
    const updatePromises = orderUpdates.map(async ({ endpoint, order }) => {
      const result = await AdminEndpointSettings.findOneAndUpdate(
        { endpoint },
        { 
          $set: { 
            order, 
            updatedBy, 
            updatedAt: new Date() 
          } 
        },
        { 
          upsert: true,
          setDefaultsOnInsert: true
        }
      ).exec();
      
      if (result) {
        updatedCount++;
      }
      return result;
    });

    await Promise.all(updatePromises);

    // Clear all related caches to force refresh
    await cache.delete(cacheKey);
    await cache.delete(CacheKeys.ENDPOINT_CONFIG); // Clear base endpoint config cache
    await cache.delete(`${CacheKeys.ENDPOINT_CONFIG}_USER`); // Clear USER role cache
    await cache.delete(`${CacheKeys.ENDPOINT_CONFIG}_ADMIN`); // Clear ADMIN role cache
    await cache.delete(CacheKeys.CONFIG); // Clear app config cache
    
    logger.info(`[updateEndpointOrders] Updated order for ${updatedCount} endpoints by user ${updatedBy}`);
    return updatedCount;
  } catch (error) {
    logger.error('[updateEndpointOrders]', error);
    throw new Error(`Failed to update endpoint orders: ${error.message}`);
  }
};

/**
 * Get filtered endpoints based on user role
 * @param {string} userRole - User role (ADMIN, USER, etc.)
 * @returns {Promise<string[]>} Array of enabled endpoint names for the role
 */
const getEnabledEndpointsForRole = async function (userRole = 'USER') {
  try {
    const settings = await getAllEndpointSettings();
    
    // Filter enabled endpoints that the user role can access
    const enabledEndpoints = settings
      .filter(setting => {
        // Endpoint must be enabled
        if (!setting.enabled) {
          return false;
        }
        
        // Check if user role is allowed
        if (setting.allowedRoles && setting.allowedRoles.length > 0) {
          return setting.allowedRoles.includes(userRole);
        }
        
        // If no specific roles defined, allow all roles
        return true;
      })
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map(setting => setting.endpoint);

    return enabledEndpoints;
  } catch (error) {
    logger.error('[getEnabledEndpointsForRole]', error);
    throw new Error(`Failed to get enabled endpoints for role: ${error.message}`);
  }
};

/**
 * Initialize default endpoint settings
 * @param {string[]} defaultEndpoints - Array of default endpoint names
 * @returns {Promise<number>} Number of initialized endpoints
 */
const initializeDefaultEndpointSettings = async function (defaultEndpoints) {
  try {
    let initializedCount = 0;
    
    // Remove duplicates from defaultEndpoints array
    const uniqueEndpoints = [...new Set(defaultEndpoints)];
    
    for (let i = 0; i < uniqueEndpoints.length; i++) {
      const endpoint = uniqueEndpoints[i];
      const existingSetting = await AdminEndpointSettings.findOne({ endpoint });
      
      if (!existingSetting) {
        await AdminEndpointSettings.create({
          endpoint,
          enabled: true,
          allowedRoles: ['USER', 'ADMIN'],
          order: i,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
        initializedCount++;
      }
    }
    
    if (initializedCount > 0) {
      // Clear cache to force refresh
      const cache = getLogStores(CacheKeys.CONFIG_STORE);
      await cache.delete('admin_endpoint_settings');
      
      logger.info(`[initializeDefaultEndpointSettings] Initialized ${initializedCount} default endpoint settings`);
    }
    
    return initializedCount;
  } catch (error) {
    logger.error('[initializeDefaultEndpointSettings]', error);
    throw new Error(`Failed to initialize default endpoint settings: ${error.message}`);
  }
};

/**
 * Clear endpoint settings cache
 * @returns {Promise<boolean>} Success status
 */
const clearEndpointSettingsCache = async function () {
  try {
    const cache = getLogStores(CacheKeys.CONFIG_STORE);
    await cache.delete('admin_endpoint_settings');
    return true;
  } catch (error) {
    logger.error('[clearEndpointSettingsCache]', error);
    return false;
  }
};

/**
 * Remove duplicate endpoint settings
 * @returns {Promise<number>} Number of duplicates removed
 */
const removeDuplicateEndpoints = async function () {
  try {
    const allSettings = await AdminEndpointSettings.find({}).sort({ createdAt: 1 });
    const seen = new Set();
    let removedCount = 0;

    for (const setting of allSettings) {
      if (seen.has(setting.endpoint)) {
        await AdminEndpointSettings.deleteOne({ _id: setting._id });
        removedCount++;
        logger.info(`[removeDuplicateEndpoints] Removed duplicate: ${setting.endpoint}`);
      } else {
        seen.add(setting.endpoint);
      }
    }

    if (removedCount > 0) {
      // Clear cache after cleanup
      await clearEndpointSettingsCache();
      logger.info(`[removeDuplicateEndpoints] Removed ${removedCount} duplicate endpoints`);
    }

    return removedCount;
  } catch (error) {
    logger.error('[removeDuplicateEndpoints]', error);
    throw new Error(`Failed to remove duplicates: ${error.message}`);
  }
};

module.exports = {
  getAllEndpointSettings,
  getEndpointSetting,
  upsertEndpointSetting,
  toggleEndpointStatus,
  updateEndpointOrders,
  getEnabledEndpointsForRole,
  initializeDefaultEndpointSettings,
  clearEndpointSettingsCache,
  removeDuplicateEndpoints,
};