const { CacheKeys } = require('librechat-data-provider');
const { logger, AppService } = require('@librechat/data-schemas');
const { loadAndFormatTools } = require('~/server/services/start/tools');
const loadCustomConfig = require('./loadCustomConfig');
const { setCachedTools } = require('./getCachedTools');
const getLogStores = require('~/cache/getLogStores');
const paths = require('~/config/paths');
const { getEnabledEndpointsForRole } = require('~/models/AdminEndpointSettings');

const BASE_CONFIG_KEY = '_BASE_';

/**
 * Apply role-based modifications to the base configuration
 * @param {AppConfig} baseConfig - The base configuration
 * @param {string} role - User role
 * @returns {Promise<AppConfig>} Modified configuration
 */
async function applyRoleBasedConfig(baseConfig, role) {
  try {
    // Clone the base config to avoid mutations
    const roleConfig = JSON.parse(JSON.stringify(baseConfig));

    // Admin users get full access - skip endpoint filtering
    if (role === 'ADMIN') {
      logger.info(`[applyRoleBasedConfig] Admin user detected - providing full endpoint access`);
      await applyRoleSpecificCustomizations(roleConfig, role);
      return roleConfig;
    }

    // Get enabled endpoints for this role from admin settings
    const enabledEndpoints = await getEnabledEndpointsForRole(role);
    
    logger.info(`[applyRoleBasedConfig] Role ${role} has access to endpoints: ${enabledEndpoints.join(', ')}`);

    // Filter endpoints configuration based on role permissions
    if (roleConfig.endpoints) {
      const filteredEndpoints = {};

      // Only include endpoints that are enabled for this role
      for (const [endpointKey, endpointConfig] of Object.entries(roleConfig.endpoints)) {
        // Always preserve the 'custom' array as it contains custom endpoint definitions
        // The actual role-based filtering for custom endpoints happens later in getEndpointsConfig
        if (endpointKey === 'custom') {
          filteredEndpoints[endpointKey] = endpointConfig;
        } else if (enabledEndpoints.includes(endpointKey)) {
          filteredEndpoints[endpointKey] = endpointConfig;
        } else {
          logger.debug(`[applyRoleBasedConfig] Filtering out endpoint ${endpointKey} for role ${role}`);
        }
      }

      roleConfig.endpoints = filteredEndpoints;
    }

    // Update default endpoints list to match filtered endpoints
    if (roleConfig.defaultEndpoints) {
      roleConfig.defaultEndpoints = roleConfig.defaultEndpoints.filter(endpoint => 
        enabledEndpoints.includes(endpoint)
      );
    }

    // Apply additional role-specific customizations
    await applyRoleSpecificCustomizations(roleConfig, role);

    logger.info(`[applyRoleBasedConfig] Applied role-based config for role ${role}. Available endpoints: ${Object.keys(roleConfig.endpoints || {}).length}`);
    
    return roleConfig;
  } catch (error) {
    logger.error(`[applyRoleBasedConfig] Error applying role-based config for role ${role}:`, error);
    throw error;
  }
}

/**
 * Apply role-specific customizations beyond endpoint filtering
 * @param {AppConfig} config - Configuration object to modify
 * @param {string} role - User role
 */
async function applyRoleSpecificCustomizations(config, role) {
  try {
    switch (role) {
      case 'ADMIN':
        // Admins get full access - no additional restrictions
        logger.debug(`[applyRoleSpecificCustomizations] Applying admin customizations - full access`);
        break;
        
      case 'USER':
        // Regular users might have additional restrictions
        logger.debug(`[applyRoleSpecificCustomizations] Applying user customizations`);
        
        // Example: Limit certain features for regular users
        if (config.features) {
          // Add any user-specific feature restrictions here
          // config.features.someFeature = false;
        }
        break;
        
      default:
        logger.debug(`[applyRoleSpecificCustomizations] No specific customizations for role ${role}`);
        break;
    }
  } catch (error) {
    logger.error(`[applyRoleSpecificCustomizations] Error applying customizations for role ${role}:`, error);
    // Don't throw here - customizations are not critical
  }
}

const loadBaseConfig = async () => {
  /** @type {TCustomConfig} */
  const config = (await loadCustomConfig()) ?? {};
  /** @type {Record<string, FunctionTool>} */
  const systemTools = loadAndFormatTools({
    adminFilter: config.filteredTools,
    adminIncluded: config.includedTools,
    directory: paths.structuredTools,
  });
  return AppService({ config, paths, systemTools });
};

/**
 * Get the app configuration based on user context
 * @param {Object} [options]
 * @param {string} [options.role] - User role for role-based config
 * @param {boolean} [options.refresh] - Force refresh the cache
 * @returns {Promise<AppConfig>}
 */
async function getAppConfig(options = {}) {
  const { role, refresh } = options;

  const cache = getLogStores(CacheKeys.APP_CONFIG);
  const cacheKey = role ? role : BASE_CONFIG_KEY;

  if (!refresh) {
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }
  }

  let baseConfig = await cache.get(BASE_CONFIG_KEY);
  if (!baseConfig) {
    logger.info('[getAppConfig] App configuration not initialized. Initializing AppService...');
    baseConfig = await loadBaseConfig();

    if (!baseConfig) {
      throw new Error('Failed to initialize app configuration through AppService.');
    }

    if (baseConfig.availableTools) {
      await setCachedTools(baseConfig.availableTools);
    }

    await cache.set(BASE_CONFIG_KEY, baseConfig);
  }

  // Apply role-based modifications if role is provided
  if (role) {
    try {
      const roleConfig = await applyRoleBasedConfig(baseConfig, role);
      await cache.set(cacheKey, roleConfig);
      return roleConfig;
    } catch (error) {
      logger.error(`[getAppConfig] Error applying role-based config for role ${role}:`, error);
      // Fallback to base config if role-based config fails
      return baseConfig;
    }
  }

  return baseConfig;
}

/**
 * Clear the app configuration cache
 * @returns {Promise<boolean>}
 */
async function clearAppConfigCache() {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const cacheKey = CacheKeys.APP_CONFIG;
  return await cache.delete(cacheKey);
}

/**
 * Initialize default endpoint settings on application startup
 * @returns {Promise<void>}
 */
async function initializeDefaultEndpoints() {
  try {
    const { getEnabledEndpoints } = require('librechat-data-provider');
    const { initializeDefaultEndpointSettings } = require('~/models/AdminEndpointSettings');
    
    const defaultEndpoints = getEnabledEndpoints();
    const initializedCount = await initializeDefaultEndpointSettings(defaultEndpoints);
    
    if (initializedCount > 0) {
      logger.info(`[initializeDefaultEndpoints] Initialized ${initializedCount} default endpoint settings`);
    } else {
      logger.debug(`[initializeDefaultEndpoints] Default endpoint settings already exist`);
    }
  } catch (error) {
    logger.error(`[initializeDefaultEndpoints] Error initializing default endpoints:`, error);
    // Don't throw - this is not critical for startup
  }
}

module.exports = {
  getAppConfig,
  clearAppConfigCache,
  initializeDefaultEndpoints,
};
