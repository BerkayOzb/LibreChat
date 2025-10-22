const { logger } = require('@librechat/data-schemas');
const { encrypt, decrypt } = require('@librechat/api');
const { CacheKeys } = require('librechat-data-provider');
const getLogStores = require('~/cache/getLogStores');
const mongoose = require('mongoose');
const { AdminApiKey } = require('@librechat/data-schemas').createModels(mongoose);

/**
 * Get all admin API keys
 * @returns {Promise<AdminApiKey[]>} Array of admin API keys
 */
const getAllAdminApiKeys = async function () {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = 'admin_api_keys';
  
  try {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const keys = await AdminApiKey.find({})
      .sort({ endpoint: 1 })
      .lean()
      .exec();

    await cache.set(cacheKey, keys, 300); // 5 minutes cache
    return keys;
  } catch (error) {
    logger.error('[getAllAdminApiKeys]', error);
    throw new Error(`Failed to retrieve admin API keys: ${error.message}`);
  }
};

/**
 * Get admin API key by endpoint name
 * @param {string} endpoint - The endpoint name
 * @returns {Promise<AdminApiKey|null>} Admin API key or null
 */
const getAdminApiKey = async function (endpoint) {
  try {
    const key = await AdminApiKey.findOne({ endpoint, isActive: true })
      .lean()
      .exec();
    
    return key;
  } catch (error) {
    logger.error('[getAdminApiKey]', error);
    throw new Error(`Failed to retrieve admin API key: ${error.message}`);
  }
};

/**
 * Get decrypted admin API key by endpoint name
 * @param {string} endpoint - The endpoint name
 * @returns {Promise<{apiKey: string, baseURL?: string}|null>} Decrypted API key data or null
 */
const getDecryptedAdminApiKey = async function (endpoint) {
  try {
    const keyData = await getAdminApiKey(endpoint);
    if (!keyData) {
      return null;
    }

    const decryptedApiKey = await decrypt(keyData.apiKey);
    const result = {
      apiKey: decryptedApiKey,
    };

    if (keyData.baseURL) {
      result.baseURL = keyData.baseURL;
    }

    if (keyData.metadata) {
      result.metadata = keyData.metadata;
    }

    // Update last used timestamp
    await AdminApiKey.findByIdAndUpdate(keyData._id, { lastUsed: new Date() });

    return result;
  } catch (error) {
    logger.error('[getDecryptedAdminApiKey]', error);
    throw new Error(`Failed to decrypt admin API key: ${error.message}`);
  }
};

/**
 * Set or update admin API key for an endpoint
 * @param {string} endpoint - The endpoint name
 * @param {string} apiKey - The API key to encrypt and store
 * @param {Object} options - Additional options
 * @param {string} options.baseURL - Optional base URL
 * @param {string} options.description - Optional description
 * @param {Object} options.metadata - Optional metadata
 * @param {boolean} options.isActive - Whether the key is active
 * @param {string} createdBy - User ID who created/updated the key
 * @returns {Promise<AdminApiKey>} Created or updated admin API key
 */
const setAdminApiKey = async function (endpoint, apiKey, options = {}, createdBy) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = 'admin_api_keys';
  
  try {
    const { baseURL, description, metadata, isActive = true } = options;
    
    // Encrypt the API key
    const encryptedApiKey = await encrypt(apiKey);
    
    const updateData = {
      apiKey: encryptedApiKey,
      baseURL,
      description,
      metadata,
      isActive,
      updatedBy: createdBy,
      updatedAt: new Date(),
    };

    const key = await AdminApiKey.findOneAndUpdate(
      { endpoint },
      { 
        $set: updateData,
        $setOnInsert: { createdBy, createdAt: new Date() }
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
    
    logger.info(`[setAdminApiKey] Set API key for endpoint '${endpoint}' by user ${createdBy}`);
    return key;
  } catch (error) {
    logger.error('[setAdminApiKey]', error);
    throw new Error(`Failed to set admin API key: ${error.message}`);
  }
};

/**
 * Toggle admin API key active status
 * @param {string} endpoint - The endpoint name
 * @param {boolean} isActive - The active status
 * @param {string} updatedBy - User ID who made the update
 * @returns {Promise<AdminApiKey>} Updated admin API key
 */
const toggleAdminApiKey = async function (endpoint, isActive, updatedBy) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = 'admin_api_keys';
  
  try {
    const key = await AdminApiKey.findOneAndUpdate(
      { endpoint },
      { 
        $set: { 
          isActive, 
          updatedBy, 
          updatedAt: new Date() 
        } 
      },
      { 
        new: true, 
        lean: true
      }
    ).exec();

    if (!key) {
      throw new Error(`Admin API key not found for endpoint: ${endpoint}`);
    }

    // Clear all related caches to force refresh
    await cache.delete(cacheKey);
    await cache.delete(CacheKeys.ENDPOINT_CONFIG);
    await cache.delete(`${CacheKeys.ENDPOINT_CONFIG}_USER`);
    await cache.delete(`${CacheKeys.ENDPOINT_CONFIG}_ADMIN`);
    await cache.delete(CacheKeys.CONFIG);
    
    logger.info(`[toggleAdminApiKey] ${isActive ? 'Activated' : 'Deactivated'} API key for endpoint '${endpoint}' by user ${updatedBy}`);
    return key;
  } catch (error) {
    logger.error('[toggleAdminApiKey]', error);
    throw new Error(`Failed to toggle admin API key: ${error.message}`);
  }
};

/**
 * Delete admin API key for an endpoint
 * @param {string} endpoint - The endpoint name
 * @param {string} deletedBy - User ID who deleted the key
 * @returns {Promise<boolean>} Success status
 */
const deleteAdminApiKey = async function (endpoint, deletedBy) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = 'admin_api_keys';
  
  try {
    const result = await AdminApiKey.findOneAndDelete({ endpoint }).exec();
    
    if (!result) {
      throw new Error(`Admin API key not found for endpoint: ${endpoint}`);
    }

    // Clear all related caches to force refresh
    await cache.delete(cacheKey);
    await cache.delete(CacheKeys.ENDPOINT_CONFIG);
    await cache.delete(`${CacheKeys.ENDPOINT_CONFIG}_USER`);
    await cache.delete(`${CacheKeys.ENDPOINT_CONFIG}_ADMIN`);
    await cache.delete(CacheKeys.CONFIG);
    
    logger.info(`[deleteAdminApiKey] Deleted API key for endpoint '${endpoint}' by user ${deletedBy}`);
    return true;
  } catch (error) {
    logger.error('[deleteAdminApiKey]', error);
    throw new Error(`Failed to delete admin API key: ${error.message}`);
  }
};

/**
 * Check if admin API key exists and is active for an endpoint
 * @param {string} endpoint - The endpoint name
 * @returns {Promise<boolean>} Whether admin key exists and is active
 */
const hasActiveAdminApiKey = async function (endpoint) {
  try {
    const key = await AdminApiKey.findOne({ 
      endpoint, 
      isActive: true 
    }).select('_id').lean().exec();
    
    return !!key;
  } catch (error) {
    logger.error('[hasActiveAdminApiKey]', error);
    return false;
  }
};

/**
 * Get admin API keys for response (with masked API keys)
 * @returns {Promise<Object[]>} Array of admin API keys with masked keys
 */
const getAdminApiKeysForResponse = async function () {
  try {
    const keys = await getAllAdminApiKeys();
    
    return keys.map(key => ({
      _id: key._id,
      endpoint: key.endpoint,
      apiKey: maskApiKey(key.apiKey), // Mask the encrypted key for security
      baseURL: key.baseURL,
      isActive: key.isActive,
      description: key.description,
      metadata: key.metadata,
      createdBy: key.createdBy,
      updatedBy: key.updatedBy,
      lastUsed: key.lastUsed,
      createdAt: key.createdAt,
      updatedAt: key.updatedAt,
    }));
  } catch (error) {
    logger.error('[getAdminApiKeysForResponse]', error);
    throw new Error(`Failed to get admin API keys for response: ${error.message}`);
  }
};

/**
 * Mask API key for security display
 * @param {string} encryptedKey - The encrypted API key
 * @returns {string} Masked key
 */
const maskApiKey = function (encryptedKey) {
  if (!encryptedKey || encryptedKey.length < 8) {
    return '****';
  }
  
  const start = encryptedKey.substring(0, 4);
  const end = encryptedKey.substring(encryptedKey.length - 4);
  return `${start}****...****${end}`;
};

/**
 * Clear admin API keys cache
 * @returns {Promise<boolean>} Success status
 */
const clearAdminApiKeysCache = async function () {
  try {
    const cache = getLogStores(CacheKeys.CONFIG_STORE);
    await cache.delete('admin_api_keys');
    return true;
  } catch (error) {
    logger.error('[clearAdminApiKeysCache]', error);
    return false;
  }
};

/**
 * Get admin API key statistics
 * @returns {Promise<Object>} Statistics object
 */
const getAdminApiKeyStats = async function () {
  try {
    const keys = await getAllAdminApiKeys();
    
    return {
      total: keys.length,
      active: keys.filter(key => key.isActive).length,
      inactive: keys.filter(key => !key.isActive).length,
      endpoints: keys.map(key => key.endpoint),
    };
  } catch (error) {
    logger.error('[getAdminApiKeyStats]', error);
    throw new Error(`Failed to get admin API key statistics: ${error.message}`);
  }
};

module.exports = {
  getAllAdminApiKeys,
  getAdminApiKey,
  getDecryptedAdminApiKey,
  setAdminApiKey,
  toggleAdminApiKey,
  deleteAdminApiKey,
  hasActiveAdminApiKey,
  getAdminApiKeysForResponse,
  clearAdminApiKeysCache,
  getAdminApiKeyStats,
  maskApiKey,
};