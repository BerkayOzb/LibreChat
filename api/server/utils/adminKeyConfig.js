const { logger } = require('@librechat/data-schemas');
const { hasActiveAdminApiKey } = require('~/models/AdminApiKeys');
const { generateConfig } = require('./handleText');

/**
 * Generate configuration with admin key check
 * @param {string} key - Environment variable key
 * @param {string} [baseURL] - Base URL
 * @param {string} [endpoint] - Endpoint name
 * @returns {Promise<boolean | { userProvide: boolean, userProvideURL?: boolean }>}
 */
async function generateConfigWithAdminKey(key, baseURL, endpoint) {
  try {
    // First generate the standard config
    const standardConfig = generateConfig(key, baseURL, endpoint);
    
    // If standard config is false (no key), return it as is
    if (!standardConfig) {
      return standardConfig;
    }

    // If we have an endpoint name, check for admin API key
    if (endpoint) {
      const hasAdminKey = await hasActiveAdminApiKey(endpoint);
      
      if (hasAdminKey) {
        // Admin key exists - override userProvide to false
        const adminConfig = { ...standardConfig };
        adminConfig.userProvide = false;
        
        logger.debug(`[generateConfigWithAdminKey] Admin key found for endpoint ${endpoint}, setting userProvide: false`);
        return adminConfig;
      }
    }

    // No admin key, return standard config
    return standardConfig;
  } catch (error) {
    logger.error(`[generateConfigWithAdminKey] Error checking admin key for endpoint ${endpoint}:`, error);
    // Fallback to standard config on error
    return generateConfig(key, baseURL, endpoint);
  }
}

/**
 * Get admin API key configuration for an endpoint
 * @param {string} endpoint - Endpoint name
 * @returns {Promise<{hasAdminKey: boolean, userProvide: boolean}>}
 */
async function getAdminKeyStatus(endpoint) {
  try {
    const hasAdminKey = await hasActiveAdminApiKey(endpoint);
    return {
      hasAdminKey,
      userProvide: !hasAdminKey // If admin key exists, users don't need to provide
    };
  } catch (error) {
    logger.error(`[getAdminKeyStatus] Error checking admin key for endpoint ${endpoint}:`, error);
    return {
      hasAdminKey: false,
      userProvide: true // Default to user provide on error
    };
  }
}

/**
 * Check if endpoint requires user key based on admin key availability
 * @param {string} endpoint - Endpoint name
 * @returns {Promise<boolean>} Whether user needs to provide a key
 */
async function endpointRequiresUserKey(endpoint) {
  try {
    const hasAdminKey = await hasActiveAdminApiKey(endpoint);
    return !hasAdminKey; // If admin key exists, user doesn't need to provide
  } catch (error) {
    logger.error(`[endpointRequiresUserKey] Error checking admin key for endpoint ${endpoint}:`, error);
    return true; // Default to requiring user key on error
  }
}

module.exports = {
  generateConfigWithAdminKey,
  getAdminKeyStatus,
  endpointRequiresUserKey,
};