const { logger } = require('@librechat/data-schemas');
const { CacheKeys, SystemRoles } = require('librechat-data-provider');
const { loadDefaultModels, loadConfigModels } = require('~/server/services/Config');
const { getLogStores } = require('~/cache');

/**
 * @param {ServerRequest} req
 * @returns {Promise<TModelsConfig>} The models config.
 */
const getModelsConfig = async (req) => {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const isAdmin = req.user && req.user.role === SystemRoles.ADMIN;
  const cacheKey = isAdmin ? `${CacheKeys.MODELS_CONFIG}_ADMIN` : `${CacheKeys.MODELS_CONFIG}_USER`;
  
  let modelsConfig = await cache.get(cacheKey);
  if (!modelsConfig) {
    modelsConfig = await loadModels(req);
    await cache.set(cacheKey, modelsConfig, 300); // 5 minutes cache
  }

  return modelsConfig;
};

/**
 * Loads the models from the config with role-based caching.
 * @param {ServerRequest} req - The Express request object.
 * @returns {Promise<TModelsConfig>} The models config.
 */
async function loadModels(req) {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);
  const isAdmin = req.user && req.user.role === SystemRoles.ADMIN;
  const cacheKey = isAdmin ? `${CacheKeys.MODELS_CONFIG}_ADMIN` : `${CacheKeys.MODELS_CONFIG}_USER`;
  
  const cachedModelsConfig = await cache.get(cacheKey);
  if (cachedModelsConfig) {
    return cachedModelsConfig;
  }
  
  const defaultModelsConfig = await loadDefaultModels(req);
  const customModelsConfig = await loadConfigModels(req);

  const modelConfig = { ...defaultModelsConfig, ...customModelsConfig };

  await cache.set(cacheKey, modelConfig, 300); // 5 minutes cache
  return modelConfig;
}

async function modelController(req, res) {
  try {
    const modelConfig = await loadModels(req);
    res.send(modelConfig);
  } catch (error) {
    logger.error('Error fetching models:', error);
    res.status(500).send({ error: error.message });
  }
}

module.exports = { modelController, loadModels, getModelsConfig };
