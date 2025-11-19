const { logger } = require('@librechat/data-schemas');
const { EModelEndpoint, SystemRoles } = require('librechat-data-provider');
const {
  getAnthropicModels,
  getBedrockModels,
  getOpenAIModels,
  getGoogleModels,
} = require('~/server/services/ModelService');
const { filterModelsForUser } = require('~/models/AdminModelSettings');

/**
 * Loads the default models for the application with admin filtering applied.
 * @async
 * @function
 * @param {ServerRequest} req - The Express request object.
 */
async function loadDefaultModels(req) {
  try {
    // Check if user is an admin
    const isAdmin = req.user && req.user.role === SystemRoles.ADMIN;
    
    const [openAI, anthropic, azureOpenAI, assistants, azureAssistants, google, bedrock] =
      await Promise.all([
        getOpenAIModels({ user: req.user.id }).catch((error) => {
          logger.error('Error fetching OpenAI models:', error);
          return [];
        }),
        getAnthropicModels({ user: req.user.id }).catch((error) => {
          logger.error('Error fetching Anthropic models:', error);
          return [];
        }),
        getOpenAIModels({ user: req.user.id, azure: true }).catch((error) => {
          logger.error('Error fetching Azure OpenAI models:', error);
          return [];
        }),
        getOpenAIModels({ assistants: true }).catch((error) => {
          logger.error('Error fetching OpenAI Assistants API models:', error);
          return [];
        }),
        getOpenAIModels({ azureAssistants: true }).catch((error) => {
          logger.error('Error fetching Azure OpenAI Assistants API models:', error);
          return [];
        }),
        Promise.resolve(getGoogleModels()).catch((error) => {
          logger.error('Error getting Google models:', error);
          return [];
        }),
        Promise.resolve(getBedrockModels()).catch((error) => {
          logger.error('Error getting Bedrock models:', error);
          return [];
        }),
      ]);

    // Apply admin model filtering for all users (including admins)
    // Admin panel uses separate API to view all models including disabled ones
    const filteredModels = {};

    try {
      filteredModels[EModelEndpoint.openAI] = await filterModelsForUser(EModelEndpoint.openAI, openAI, false);
      filteredModels[EModelEndpoint.google] = await filterModelsForUser(EModelEndpoint.google, google, false);
      filteredModels[EModelEndpoint.anthropic] = await filterModelsForUser(EModelEndpoint.anthropic, anthropic, false);
      filteredModels[EModelEndpoint.azureOpenAI] = await filterModelsForUser(EModelEndpoint.azureOpenAI, azureOpenAI, false);
      filteredModels[EModelEndpoint.assistants] = await filterModelsForUser(EModelEndpoint.assistants, assistants, false);
      filteredModels[EModelEndpoint.azureAssistants] = await filterModelsForUser(EModelEndpoint.azureAssistants, azureAssistants, false);
      filteredModels[EModelEndpoint.bedrock] = await filterModelsForUser(EModelEndpoint.bedrock, bedrock, false);
    } catch (filterError) {
      logger.error('Error applying admin model filtering:', filterError);
      // Fallback to original models if filtering fails
      return {
        [EModelEndpoint.openAI]: openAI,
        [EModelEndpoint.google]: google,
        [EModelEndpoint.anthropic]: anthropic,
        [EModelEndpoint.azureOpenAI]: azureOpenAI,
        [EModelEndpoint.assistants]: assistants,
        [EModelEndpoint.azureAssistants]: azureAssistants,
        [EModelEndpoint.bedrock]: bedrock,
      };
    }

    logger.debug(`[loadDefaultModels] Applied admin model filtering for user ${req.user.id}`);

    return filteredModels;
  } catch (error) {
    logger.error('Error fetching default models:', error);
    throw new Error(`Failed to load default models: ${error.message}`);
  }
}

module.exports = loadDefaultModels;
