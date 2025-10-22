const { loadCustomEndpointsConfig } = require('@librechat/api');
const {
  CacheKeys,
  EModelEndpoint,
  isAgentsEndpoint,
  orderEndpointsConfig,
  defaultAgentCapabilities,
} = require('librechat-data-provider');
const loadDefaultEndpointsConfig = require('./loadDefaultEConfig');
const getLogStores = require('~/cache/getLogStores');
const { getAppConfig } = require('./app');
const { hasActiveAdminApiKey } = require('~/models/AdminApiKeys');

/**
 *
 * @param {ServerRequest} req
 * @returns {Promise<TEndpointsConfig>}
 */
async function getEndpointsConfig(req) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const userRole = req.user?.role || 'USER';
  
  // Use role-specific cache key to prevent role mixing
  const roleCacheKey = `${CacheKeys.ENDPOINT_CONFIG}_${userRole}`;
  const cachedEndpointsConfig = await cache.get(roleCacheKey);
  if (cachedEndpointsConfig) {
      return cachedEndpointsConfig;
  }

  const appConfig = req.config ?? (await getAppConfig({ role: userRole }));
  const defaultEndpointsConfig = await loadDefaultEndpointsConfig(appConfig);
  const customEndpointsConfig = loadCustomEndpointsConfig(appConfig?.endpoints?.custom);

  /** @type {TEndpointsConfig} */
  const mergedConfig = {
    ...defaultEndpointsConfig,
    ...customEndpointsConfig,
  };

  if (appConfig.endpoints?.[EModelEndpoint.azureOpenAI]) {
    /** @type {Omit<TConfig, 'order'>} */
    mergedConfig[EModelEndpoint.azureOpenAI] = {
      userProvide: false,
    };
  }

  if (appConfig.endpoints?.[EModelEndpoint.azureOpenAI]?.assistants) {
    /** @type {Omit<TConfig, 'order'>} */
    mergedConfig[EModelEndpoint.azureAssistants] = {
      userProvide: false,
    };
  }

  if (
    mergedConfig[EModelEndpoint.assistants] &&
    appConfig?.endpoints?.[EModelEndpoint.assistants]
  ) {
    const { disableBuilder, retrievalModels, capabilities, version, ..._rest } =
      appConfig.endpoints[EModelEndpoint.assistants];

    mergedConfig[EModelEndpoint.assistants] = {
      ...mergedConfig[EModelEndpoint.assistants],
      version,
      retrievalModels,
      disableBuilder,
      capabilities,
    };
  }
  if (mergedConfig[EModelEndpoint.agents] && appConfig?.endpoints?.[EModelEndpoint.agents]) {
    const { disableBuilder, capabilities, allowedProviders, ..._rest } =
      appConfig.endpoints[EModelEndpoint.agents];

    mergedConfig[EModelEndpoint.agents] = {
      ...mergedConfig[EModelEndpoint.agents],
      allowedProviders,
      disableBuilder,
      capabilities,
    };
  }

  if (
    mergedConfig[EModelEndpoint.azureAssistants] &&
    appConfig?.endpoints?.[EModelEndpoint.azureAssistants]
  ) {
    const { disableBuilder, retrievalModels, capabilities, version, ..._rest } =
      appConfig.endpoints[EModelEndpoint.azureAssistants];

    mergedConfig[EModelEndpoint.azureAssistants] = {
      ...mergedConfig[EModelEndpoint.azureAssistants],
      version,
      retrievalModels,
      disableBuilder,
      capabilities,
    };
  }

  if (mergedConfig[EModelEndpoint.bedrock] && appConfig?.endpoints?.[EModelEndpoint.bedrock]) {
    const { availableRegions } = appConfig.endpoints[EModelEndpoint.bedrock];
    mergedConfig[EModelEndpoint.bedrock] = {
      ...mergedConfig[EModelEndpoint.bedrock],
      availableRegions,
    };
  }

  let endpointsConfig = orderEndpointsConfig(mergedConfig);

  // Apply admin API key overrides before role-based filtering
  try {
    for (const [endpointKey, endpointConfig] of Object.entries(endpointsConfig)) {
      if (endpointConfig && typeof endpointConfig === 'object') {
        const hasAdminKey = await hasActiveAdminApiKey(endpointKey);
        if (hasAdminKey) {
          // Override userProvide to false when admin key exists
          endpointsConfig[endpointKey] = {
            ...endpointConfig,
            userProvide: false
          };
        }
      }
    }
  } catch (error) {
    // Don't break the flow if admin key check fails
    console.warn('[getEndpointsConfig] Error checking admin keys:', error.message);
  }

  // Apply role-based filtering at the final step for non-admin users
  if (userRole !== 'ADMIN') {
    const { getEnabledEndpointsForRole } = require('~/models/AdminEndpointSettings');
    const enabledEndpoints = await getEnabledEndpointsForRole(userRole);
    
    // Filter the final endpoints config
    const filteredConfig = {};
    for (const [endpointKey, endpointConfig] of Object.entries(endpointsConfig)) {
      if (enabledEndpoints.includes(endpointKey)) {
        filteredConfig[endpointKey] = endpointConfig;
      }
    }
    endpointsConfig = filteredConfig;
  }

  // Use role-specific cache key for setting cache
  await cache.set(roleCacheKey, endpointsConfig);
  return endpointsConfig;
}

/**
 * @param {ServerRequest} req
 * @param {import('librechat-data-provider').AgentCapabilities} capability
 * @returns {Promise<boolean>}
 */
const checkCapability = async (req, capability) => {
  const isAgents = isAgentsEndpoint(req.body?.original_endpoint || req.body?.endpoint);
  const endpointsConfig = await getEndpointsConfig(req);
  const capabilities =
    isAgents || endpointsConfig?.[EModelEndpoint.agents]?.capabilities != null
      ? (endpointsConfig?.[EModelEndpoint.agents]?.capabilities ?? [])
      : defaultAgentCapabilities;
  return capabilities.includes(capability);
};

module.exports = { getEndpointsConfig, checkCapability };
