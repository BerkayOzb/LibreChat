const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');
const {
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
} = require('~/models/AdminApiKeys');

/**
 * Get all admin API keys with statistics
 * @route GET /api/admin/api-keys
 * @access Admin
 */
const getAdminApiKeys = async (req, res) => {
  try {
    const keys = await getAdminApiKeysForResponse();
    const stats = await getAdminApiKeyStats();

    res.status(200).json({
      keys,
      stats,
      message: 'Admin API keys retrieved successfully'
    });
  } catch (error) {
    logger.error('[getAdminApiKeys]', error);
    res.status(500).json({ 
      message: 'Error retrieving admin API keys',
      error: error.message 
    });
  }
};

/**
 * Get single admin API key by endpoint
 * @route GET /api/admin/api-keys/:endpoint
 * @access Admin
 */
const getAdminApiKeyByEndpoint = async (req, res) => {
  try {
    const { endpoint } = req.params;
    
    if (!endpoint) {
      return res.status(400).json({
        message: 'Endpoint parameter is required'
      });
    }

    const key = await getAdminApiKey(endpoint);
    
    if (!key) {
      return res.status(404).json({
        message: `Admin API key not found for endpoint: ${endpoint}`
      });
    }

    // Return masked key for security
    const responseKey = {
      ...key,
      apiKey: '****' // Never return actual key data
    };

    res.status(200).json({
      key: responseKey,
      message: 'Admin API key retrieved successfully'
    });
  } catch (error) {
    logger.error('[getAdminApiKeyByEndpoint]', error);
    res.status(500).json({ 
      message: 'Error retrieving admin API key',
      error: error.message 
    });
  }
};

/**
 * Set or update admin API key for an endpoint
 * @route POST /api/admin/api-keys/:endpoint
 * @access Admin
 */
const setAdminApiKeyForEndpoint = async (req, res) => {
  try {
    const { endpoint } = req.params;
    const { apiKey, baseURL, description, metadata, isActive = true } = req.body;
    const userId = req.user.id;

    if (!endpoint) {
      return res.status(400).json({
        message: 'Endpoint parameter is required'
      });
    }

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return res.status(400).json({
        message: 'Valid API key is required'
      });
    }

    // Validate baseURL if provided
    if (baseURL && typeof baseURL !== 'string') {
      return res.status(400).json({
        message: 'Base URL must be a string'
      });
    }

    // Validate baseURL format if provided
    if (baseURL) {
      try {
        new URL(baseURL);
      } catch (urlError) {
        return res.status(400).json({
          message: 'Invalid base URL format'
        });
      }
    }

    const options = {
      baseURL,
      description,
      metadata,
      isActive
    };

    const updatedKey = await setAdminApiKey(endpoint, apiKey.trim(), options, userId);

    res.status(200).json({ 
      key: {
        ...updatedKey,
        apiKey: '****' // Never return actual key data
      },
      message: `Admin API key ${updatedKey.createdAt === updatedKey.updatedAt ? 'created' : 'updated'} successfully for endpoint: ${endpoint}` 
    });
  } catch (error) {
    logger.error('[setAdminApiKeyForEndpoint]', error);
    res.status(500).json({ 
      message: 'Error setting admin API key',
      error: error.message 
    });
  }
};

/**
 * Update admin API key settings (without changing the key itself)
 * @route PUT /api/admin/api-keys/:endpoint
 * @access Admin
 */
const updateAdminApiKeySettings = async (req, res) => {
  try {
    const { endpoint } = req.params;
    const { baseURL, description, metadata, isActive } = req.body;
    const userId = req.user.id;

    if (!endpoint) {
      return res.status(400).json({
        message: 'Endpoint parameter is required'
      });
    }

    // Get existing key
    const existingKey = await getAdminApiKey(endpoint);
    if (!existingKey) {
      return res.status(404).json({
        message: `Admin API key not found for endpoint: ${endpoint}`
      });
    }

    // Validate baseURL if provided
    if (baseURL && typeof baseURL !== 'string') {
      return res.status(400).json({
        message: 'Base URL must be a string'
      });
    }

    // Validate baseURL format if provided
    if (baseURL) {
      try {
        new URL(baseURL);
      } catch (urlError) {
        return res.status(400).json({
          message: 'Invalid base URL format'
        });
      }
    }

    // Use existing encrypted API key, just update other settings
    const options = {
      baseURL: baseURL !== undefined ? baseURL : existingKey.baseURL,
      description: description !== undefined ? description : existingKey.description,
      metadata: metadata !== undefined ? metadata : existingKey.metadata,
      isActive: isActive !== undefined ? isActive : existingKey.isActive
    };

    // Get decrypted key to re-encrypt with new settings
    const decryptedKey = await getDecryptedAdminApiKey(endpoint);
    const updatedKey = await setAdminApiKey(endpoint, decryptedKey.apiKey, options, userId);

    res.status(200).json({ 
      key: {
        ...updatedKey,
        apiKey: '****' // Never return actual key data
      },
      message: `Admin API key settings updated successfully for endpoint: ${endpoint}` 
    });
  } catch (error) {
    logger.error('[updateAdminApiKeySettings]', error);
    res.status(500).json({ 
      message: 'Error updating admin API key settings',
      error: error.message 
    });
  }
};

/**
 * Toggle admin API key active status
 * @route PATCH /api/admin/api-keys/:endpoint/toggle
 * @access Admin
 */
const toggleAdminApiKeyStatus = async (req, res) => {
  try {
    const { endpoint } = req.params;
    const { isActive } = req.body;
    const userId = req.user.id;

    if (!endpoint) {
      return res.status(400).json({
        message: 'Endpoint parameter is required'
      });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        message: 'isActive must be a boolean value'
      });
    }

    const updatedKey = await toggleAdminApiKey(endpoint, isActive, userId);

    res.status(200).json({ 
      key: {
        ...updatedKey,
        apiKey: '****' // Never return actual key data
      },
      message: `Admin API key ${isActive ? 'activated' : 'deactivated'} successfully for endpoint: ${endpoint}` 
    });
  } catch (error) {
    logger.error('[toggleAdminApiKeyStatus]', error);
    res.status(500).json({ 
      message: 'Error toggling admin API key status',
      error: error.message 
    });
  }
};

/**
 * Delete admin API key for an endpoint
 * @route DELETE /api/admin/api-keys/:endpoint
 * @access Admin
 */
const deleteAdminApiKeyForEndpoint = async (req, res) => {
  try {
    const { endpoint } = req.params;
    const userId = req.user.id;

    if (!endpoint) {
      return res.status(400).json({
        message: 'Endpoint parameter is required'
      });
    }

    const success = await deleteAdminApiKey(endpoint, userId);

    if (success) {
      res.status(200).json({ 
        message: `Admin API key deleted successfully for endpoint: ${endpoint}` 
      });
    } else {
      res.status(500).json({ 
        message: 'Error deleting admin API key' 
      });
    }
  } catch (error) {
    logger.error('[deleteAdminApiKeyForEndpoint]', error);
    res.status(500).json({ 
      message: 'Error deleting admin API key',
      error: error.message 
    });
  }
};

/**
 * Check if admin API key exists for an endpoint
 * @route GET /api/admin/api-keys/:endpoint/exists
 * @access Admin
 */
const checkAdminApiKeyExists = async (req, res) => {
  try {
    const { endpoint } = req.params;

    if (!endpoint) {
      return res.status(400).json({
        message: 'Endpoint parameter is required'
      });
    }

    const exists = await hasActiveAdminApiKey(endpoint);

    res.status(200).json({
      exists,
      endpoint,
      message: `Admin API key ${exists ? 'exists' : 'does not exist'} for endpoint: ${endpoint}`
    });
  } catch (error) {
    logger.error('[checkAdminApiKeyExists]', error);
    res.status(500).json({ 
      message: 'Error checking admin API key existence',
      error: error.message 
    });
  }
};

/**
 * Clear admin API keys cache
 * @route POST /api/admin/api-keys/cache/clear
 * @access Admin
 */
const clearApiKeysCache = async (req, res) => {
  try {
    const success = await clearAdminApiKeysCache();

    if (success) {
      res.status(200).json({ 
        message: 'Admin API keys cache cleared successfully' 
      });
    } else {
      res.status(500).json({ 
        message: 'Error clearing admin API keys cache' 
      });
    }
  } catch (error) {
    logger.error('[clearApiKeysCache]', error);
    res.status(500).json({ 
      message: 'Error clearing admin API keys cache',
      error: error.message 
    });
  }
};

/**
 * Get admin API key statistics
 * @route GET /api/admin/api-keys/stats
 * @access Admin
 */
const getApiKeyStatistics = async (req, res) => {
  try {
    const stats = await getAdminApiKeyStats();

    res.status(200).json({
      stats,
      message: 'Admin API key statistics retrieved successfully'
    });
  } catch (error) {
    logger.error('[getApiKeyStatistics]', error);
    res.status(500).json({ 
      message: 'Error retrieving admin API key statistics',
      error: error.message 
    });
  }
};

module.exports = {
  getAdminApiKeys,
  getAdminApiKeyByEndpoint,
  setAdminApiKeyForEndpoint,
  updateAdminApiKeySettings,
  toggleAdminApiKeyStatus,
  deleteAdminApiKeyForEndpoint,
  checkAdminApiKeyExists,
  clearApiKeysCache,
  getApiKeyStatistics,
};