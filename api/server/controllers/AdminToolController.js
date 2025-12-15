const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');
const {
  getAllToolSettings,
  getToolSetting,
  upsertToolSetting,
  toggleToolStatus,
  updateToolOrders,
  bulkUpdateToolSettings,
  clearToolSettingsCache,
  initializeDefaultToolSettings,
  DEFAULT_TOOLS,
} = require('~/models/AdminToolSettings');
const { hasActiveAdminApiKey } = require('~/models/AdminApiKeys');

/**
 * Get all tool settings with statistics
 * @route GET /api/admin/tools
 * @access Admin
 */
const getToolSettings = async (req, res) => {
  try {
    const settings = await getAllToolSettings();

    const stats = {
      total: settings.length,
      enabled: settings.filter(s => s.enabled).length,
      disabled: settings.filter(s => !s.enabled).length,
    };

    res.status(200).json({
      settings,
      stats,
      message: 'Tool settings retrieved successfully',
    });
  } catch (error) {
    logger.error('[getToolSettings]', error);
    res.status(500).json({
      message: 'Error retrieving tool settings',
      error: error.message,
    });
  }
};

/**
 * Get single tool setting
 * @route GET /api/admin/tools/:toolId
 * @access Admin
 */
const getToolSettingById = async (req, res) => {
  try {
    const { toolId } = req.params;

    if (!toolId) {
      return res.status(400).json({ message: 'Tool ID parameter is required' });
    }

    const setting = await getToolSetting(toolId);

    if (!setting) {
      return res.status(404).json({ message: 'Tool setting not found' });
    }

    res.status(200).json({
      setting,
      message: 'Tool setting retrieved successfully',
    });
  } catch (error) {
    logger.error('[getToolSettingById]', error);
    res.status(500).json({
      message: 'Error retrieving tool setting',
      error: error.message,
    });
  }
};

/**
 * Update tool setting
 * @route PUT /api/admin/tools/:toolId
 * @access Admin
 */
const updateToolSetting = async (req, res) => {
  try {
    const { toolId } = req.params;
    const { enabled, allowedRoles, order, description, metadata } = req.body;
    const userId = req.user.id;

    if (!toolId) {
      return res.status(400).json({ message: 'Tool ID parameter is required' });
    }

    // Validate allowed roles
    if (allowedRoles && Array.isArray(allowedRoles)) {
      const validRoles = Object.values(SystemRoles);
      const invalidRoles = allowedRoles.filter(role => !validRoles.includes(role));
      if (invalidRoles.length > 0) {
        return res.status(400).json({
          message: `Invalid roles: ${invalidRoles.join(', ')}. Valid roles are: ${validRoles.join(', ')}`,
        });
      }
    }

    const updateData = {};
    if (typeof enabled === 'boolean') updateData.enabled = enabled;
    if (allowedRoles) updateData.allowedRoles = allowedRoles;
    if (typeof order === 'number') updateData.order = order;
    if (description !== undefined) updateData.description = description;
    if (metadata !== undefined) updateData.metadata = metadata;

    const setting = await upsertToolSetting(toolId, updateData, userId);

    res.status(200).json({
      setting,
      message: 'Tool setting updated successfully',
    });
  } catch (error) {
    logger.error('[updateToolSetting]', error);
    res.status(500).json({
      message: 'Error updating tool setting',
      error: error.message,
    });
  }
};

/**
 * Toggle tool enabled/disabled status
 * @route PATCH /api/admin/tools/:toolId/toggle
 * @access Admin
 */
const toggleTool = async (req, res) => {
  try {
    const { toolId } = req.params;
    const { enabled, reason } = req.body;
    const userId = req.user.id;

    if (!toolId) {
      return res.status(400).json({ message: 'Tool ID parameter is required' });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'Enabled status is required and must be a boolean' });
    }

    const setting = await toggleToolStatus(toolId, enabled, userId, reason);

    res.status(200).json({
      setting,
      message: `Tool ${enabled ? 'enabled' : 'disabled'} successfully`,
    });
  } catch (error) {
    logger.error('[toggleTool]', error);
    res.status(500).json({
      message: 'Error toggling tool status',
      error: error.message,
    });
  }
};

/**
 * Reorder tools
 * @route PUT /api/admin/tools/reorder
 * @access Admin
 */
const reorderTools = async (req, res) => {
  try {
    const { orders } = req.body;
    const userId = req.user.id;

    if (!orders || !Array.isArray(orders)) {
      return res.status(400).json({ message: 'Orders array is required' });
    }

    // Validate orders format
    const validOrders = orders.every(
      item => typeof item.toolId === 'string' && typeof item.order === 'number'
    );

    if (!validOrders) {
      return res.status(400).json({
        message: 'Each order item must have toolId (string) and order (number)',
      });
    }

    const settings = await updateToolOrders(orders, userId);

    res.status(200).json({
      settings,
      message: 'Tool order updated successfully',
    });
  } catch (error) {
    logger.error('[reorderTools]', error);
    res.status(500).json({
      message: 'Error reordering tools',
      error: error.message,
    });
  }
};

/**
 * Bulk update tool settings
 * @route PUT /api/admin/tools/bulk
 * @access Admin
 */
const bulkUpdateTools = async (req, res) => {
  try {
    const { updates } = req.body;
    const userId = req.user.id;

    if (!updates || !Array.isArray(updates)) {
      return res.status(400).json({ message: 'Updates array is required' });
    }

    const settings = await bulkUpdateToolSettings(updates, userId);

    res.status(200).json({
      settings,
      message: 'Tools updated successfully',
    });
  } catch (error) {
    logger.error('[bulkUpdateTools]', error);
    res.status(500).json({
      message: 'Error updating tools',
      error: error.message,
    });
  }
};

/**
 * Clear tool settings cache
 * @route POST /api/admin/tools/clear-cache
 * @access Admin
 */
const clearCache = async (req, res) => {
  try {
    await clearToolSettingsCache();

    res.status(200).json({
      message: 'Tool settings cache cleared successfully',
    });
  } catch (error) {
    logger.error('[clearCache]', error);
    res.status(500).json({
      message: 'Error clearing cache',
      error: error.message,
    });
  }
};

/**
 * Reset tool settings to defaults
 * @route POST /api/admin/tools/reset
 * @access Admin
 */
const resetToDefaults = async (req, res) => {
  try {
    // Re-initialize all default tools
    await initializeDefaultToolSettings();

    const settings = await getAllToolSettings();

    res.status(200).json({
      settings,
      message: 'Tool settings reset to defaults',
    });
  } catch (error) {
    logger.error('[resetToDefaults]', error);
    res.status(500).json({
      message: 'Error resetting tool settings',
      error: error.message,
    });
  }
};

/**
 * Get default tool configurations
 * @route GET /api/admin/tools/defaults
 * @access Admin
 */
const getDefaults = async (req, res) => {
  try {
    res.status(200).json({
      defaults: DEFAULT_TOOLS,
      message: 'Default tool configurations retrieved successfully',
    });
  } catch (error) {
    logger.error('[getDefaults]', error);
    res.status(500).json({
      message: 'Error retrieving default configurations',
      error: error.message,
    });
  }
};

/**
 * Web Search Provider options
 */
const WEB_SEARCH_PROVIDERS = {
  SEARXNG: 'searxng',
  GEMINI: 'gemini',
  OPENAI: 'openai',
  ANTHROPIC: 'anthropic',
};

/**
 * Available providers with their models
 */
const AVAILABLE_PROVIDERS = [
  {
    id: 'searxng',
    name: 'SearXNG',
    description: 'Free and open-source meta search engine',
    models: ['default'],
    defaultModel: 'default',
    noApiKey: true,
  },
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'Requires Responses API access for web search',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo'],
    defaultModel: 'gpt-4o',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
    defaultModel: 'gemini-2.0-flash',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    models: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest', 'claude-3-opus-latest'],
    defaultModel: 'claude-3-5-sonnet-latest',
  },
];

/**
 * Get web search provider configuration
 * @route GET /api/admin/tools/web-search/config
 * @access Admin
 */
const getWebSearchConfig = async (req, res) => {
  try {
    const setting = await getToolSetting('web_search');
    const config = setting?.metadata?.webSearchConfig || {
      provider: WEB_SEARCH_PROVIDERS.GEMINI,
      model: 'gemini-2.0-flash',
    };

    // Check API key availability for each provider
    // - SearXNG: Checks environment variable SEARXNG_INSTANCE_URL
    // - Others: Check admin panel API keys from database
    const apiKeyAvailability = {
      searxng: false,
      gemini: false,
      openai: false,
      anthropic: false,
    };

    // Check SearXNG URL from environment variable
    if (process.env.SEARXNG_INSTANCE_URL) {
      apiKeyAvailability.searxng = true;
      logger.debug('[getWebSearchConfig] SearXNG URL found in environment');
    }

    // Check admin API keys from database (active keys only)
    try {
      apiKeyAvailability.gemini = await hasActiveAdminApiKey('google');
    } catch (e) {
      logger.debug('[getWebSearchConfig] Error checking Google admin key:', e.message);
    }

    try {
      apiKeyAvailability.openai = await hasActiveAdminApiKey('openAI');
    } catch (e) {
      logger.debug('[getWebSearchConfig] Error checking OpenAI admin key:', e.message);
    }

    try {
      apiKeyAvailability.anthropic = await hasActiveAdminApiKey('anthropic');
    } catch (e) {
      logger.debug('[getWebSearchConfig] Error checking Anthropic admin key:', e.message);
    }

    res.status(200).json({
      config,
      availableProviders: AVAILABLE_PROVIDERS,
      apiKeyAvailability,
      message: 'Web search configuration retrieved successfully',
    });
  } catch (error) {
    logger.error('[getWebSearchConfig]', error);
    res.status(500).json({
      message: 'Error retrieving web search configuration',
      error: error.message,
    });
  }
};

/**
 * Update web search provider configuration
 * @route PUT /api/admin/tools/web-search/config
 * @access Admin
 */
const updateWebSearchConfig = async (req, res) => {
  try {
    const { provider, model, apiKey } = req.body;
    const userId = req.user.id;

    // Validate provider (searxng, gemini, openai, anthropic)
    const validProviders = Object.values(WEB_SEARCH_PROVIDERS);
    if (provider && !validProviders.includes(provider)) {
      return res.status(400).json({
        message: `Invalid provider. Must be one of: ${validProviders.join(', ')}`,
      });
    }

    // Get current setting
    const currentSetting = await getToolSetting('web_search');
    const currentMetadata = currentSetting?.metadata || {};

    // Update web search config in metadata
    const webSearchConfig = {
      ...currentMetadata.webSearchConfig,
      ...(provider && { provider }),
      ...(model && { model }),
      ...(apiKey && { apiKey }),
      updatedAt: new Date().toISOString(),
    };

    const setting = await upsertToolSetting(
      'web_search',
      {
        metadata: {
          ...currentMetadata,
          webSearchConfig,
        },
      },
      userId
    );

    logger.info(`[updateWebSearchConfig] Web search provider updated to: ${provider || 'unchanged'}`);

    res.status(200).json({
      config: setting.metadata?.webSearchConfig,
      message: 'Web search configuration updated successfully',
    });
  } catch (error) {
    logger.error('[updateWebSearchConfig]', error);
    res.status(500).json({
      message: 'Error updating web search configuration',
      error: error.message,
    });
  }
};

module.exports = {
  getToolSettings,
  getToolSettingById,
  updateToolSetting,
  toggleTool,
  reorderTools,
  bulkUpdateTools,
  clearCache,
  resetToDefaults,
  getDefaults,
  getWebSearchConfig,
  updateWebSearchConfig,
  WEB_SEARCH_PROVIDERS,
};
