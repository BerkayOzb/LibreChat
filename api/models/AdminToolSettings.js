const { logger } = require('@librechat/data-schemas');
const { CacheKeys } = require('librechat-data-provider');
const getLogStores = require('~/cache/getLogStores');
const mongoose = require('mongoose');
const { AdminToolSettings } = require('@librechat/data-schemas').createModels(mongoose);

// Default tool configurations
const DEFAULT_TOOLS = [
  {
    toolId: 'web_search',
    enabled: true,
    order: 0,
    description: 'Search the web for real-time information',
    allowedRoles: ['USER', 'ADMIN'],
  },
  {
    toolId: 'file_search',
    enabled: true,
    order: 1,
    description: 'Search through uploaded files and documents',
    allowedRoles: ['USER', 'ADMIN'],
  },
  {
    toolId: 'image_generation',
    enabled: true,
    order: 2,
    description: 'Generate images using AI models',
    allowedRoles: ['USER', 'ADMIN'],
  },
  {
    toolId: 'code_interpreter',
    enabled: true,
    order: 3,
    description: 'Execute code and analyze data',
    allowedRoles: ['USER', 'ADMIN'],
  },
  {
    toolId: 'artifacts',
    enabled: true,
    order: 4,
    description: 'Display code output and visual artifacts',
    allowedRoles: ['USER', 'ADMIN'],
  },
  {
    toolId: 'mcp_servers',
    enabled: true,
    order: 5,
    description: 'Connect to Model Context Protocol servers',
    allowedRoles: ['USER', 'ADMIN'],
  },
];

const CACHE_KEY = 'admin_tool_settings';

/**
 * Clear the tool settings cache
 */
const clearToolSettingsCache = async function () {
  try {
    const cache = getLogStores(CacheKeys.CONFIG_STORE);
    await cache.delete(CACHE_KEY);
    logger.debug('[clearToolSettingsCache] Cache cleared');
  } catch (error) {
    logger.error('[clearToolSettingsCache]', error);
  }
};

/**
 * Initialize default tool settings
 * @param {string[]} [toolIds] - Optional array of tool IDs to initialize
 * @returns {Promise<void>}
 */
const initializeDefaultToolSettings = async function (toolIds) {
  try {
    const toolsToInit = toolIds
      ? DEFAULT_TOOLS.filter(t => toolIds.includes(t.toolId))
      : DEFAULT_TOOLS;

    for (const tool of toolsToInit) {
      const existing = await AdminToolSettings.findOne({ toolId: tool.toolId }).lean();
      if (!existing) {
        await AdminToolSettings.create(tool);
        logger.debug(`[initializeDefaultToolSettings] Initialized tool: ${tool.toolId}`);
      }
    }

    await clearToolSettingsCache();
  } catch (error) {
    logger.error('[initializeDefaultToolSettings]', error);
    throw new Error(`Failed to initialize tool settings: ${error.message}`);
  }
};

/**
 * Get all tool settings
 * @returns {Promise<AdminToolSettings[]>} Array of tool settings
 */
const getAllToolSettings = async function () {
  const cache = getLogStores(CacheKeys.CONFIG_STORE);

  try {
    const cached = await cache.get(CACHE_KEY);
    if (cached) {
      logger.debug('[getAllToolSettings] Returning cached settings');
      return cached;
    }

    logger.debug('[getAllToolSettings] Fetching from database...');
    let settings = await AdminToolSettings.find({})
      .sort({ order: 1, toolId: 1 })
      .lean()
      .exec();

    logger.debug(`[getAllToolSettings] Found ${settings.length} existing settings`);

    // Auto-initialize missing tools
    const existingToolIds = settings.map(s => s.toolId);
    const missingToolIds = DEFAULT_TOOLS
      .map(t => t.toolId)
      .filter(id => !existingToolIds.includes(id));

    if (missingToolIds.length > 0) {
      logger.info(`[getAllToolSettings] Initializing ${missingToolIds.length} missing tools: ${missingToolIds.join(', ')}`);
      try {
        await initializeDefaultToolSettings(missingToolIds);
        settings = await AdminToolSettings.find({})
          .sort({ order: 1, toolId: 1 })
          .lean()
          .exec();
        logger.debug(`[getAllToolSettings] After init, found ${settings.length} settings`);
      } catch (initError) {
        logger.error('[getAllToolSettings] Failed to initialize tools, returning defaults:', initError);
        // Return default tools as fallback
        return DEFAULT_TOOLS.map((tool) => ({
          ...tool,
          _id: `default_${tool.toolId}`,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));
      }
    }

    await cache.set(CACHE_KEY, settings, 300); // 5 minutes cache
    return settings;
  } catch (error) {
    logger.error('[getAllToolSettings] Error:', error);
    // Return default tools as fallback to avoid empty state
    logger.info('[getAllToolSettings] Returning default tools as fallback');
    return DEFAULT_TOOLS.map((tool) => ({
      ...tool,
      _id: `default_${tool.toolId}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
};

/**
 * Get tool setting by tool ID
 * @param {string} toolId - The tool ID
 * @returns {Promise<AdminToolSettings|null>} Tool setting or null
 */
const getToolSetting = async function (toolId) {
  try {
    const setting = await AdminToolSettings.findOne({ toolId })
      .lean()
      .exec();

    return setting;
  } catch (error) {
    logger.error('[getToolSetting]', error);
    throw new Error(`Failed to retrieve tool setting: ${error.message}`);
  }
};

/**
 * Create or update tool setting
 * @param {string} toolId - The tool ID
 * @param {Object} data - The update data
 * @param {string} [userId] - The user ID making the update
 * @returns {Promise<AdminToolSettings>} Updated tool setting
 */
const upsertToolSetting = async function (toolId, data, userId) {
  try {
    const updateData = { ...data };
    if (userId) {
      updateData.updatedBy = userId;
    }

    const setting = await AdminToolSettings.findOneAndUpdate(
      { toolId },
      { $set: updateData },
      {
        new: true,
        upsert: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      }
    ).lean();

    await clearToolSettingsCache();
    return setting;
  } catch (error) {
    logger.error('[upsertToolSetting]', error);
    throw new Error(`Failed to update tool setting: ${error.message}`);
  }
};

/**
 * Toggle tool enabled status
 * @param {string} toolId - The tool ID
 * @param {boolean} enabled - Whether the tool should be enabled
 * @param {string} [userId] - The user ID making the change
 * @param {string} [reason] - Optional reason for disabling
 * @returns {Promise<AdminToolSettings>} Updated tool setting
 */
const toggleToolStatus = async function (toolId, enabled, userId, reason) {
  try {
    const updateData = {
      enabled,
      updatedBy: userId,
    };

    if (!enabled) {
      updateData.disabledBy = userId;
      updateData.disabledAt = new Date();
      if (reason) {
        updateData.reason = reason;
      }
    }

    const setting = await AdminToolSettings.findOneAndUpdate(
      { toolId },
      enabled
        ? { $set: updateData, $unset: { disabledBy: '', disabledAt: '', reason: '' } }
        : { $set: updateData },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    await clearToolSettingsCache();
    return setting;
  } catch (error) {
    logger.error('[toggleToolStatus]', error);
    throw new Error(`Failed to toggle tool status: ${error.message}`);
  }
};

/**
 * Update tool orders in bulk
 * @param {Array<{toolId: string, order: number}>} orders - Array of tool orders
 * @param {string} [userId] - The user ID making the update
 * @returns {Promise<AdminToolSettings[]>} Updated tool settings
 */
const updateToolOrders = async function (orders, userId) {
  try {
    const bulkOps = orders.map(({ toolId, order }) => ({
      updateOne: {
        filter: { toolId },
        update: { $set: { order, updatedBy: userId } },
        upsert: false,
      },
    }));

    await AdminToolSettings.bulkWrite(bulkOps);
    await clearToolSettingsCache();

    return await getAllToolSettings();
  } catch (error) {
    logger.error('[updateToolOrders]', error);
    throw new Error(`Failed to update tool orders: ${error.message}`);
  }
};

/**
 * Get enabled tools for a specific role
 * @param {string} role - The user role
 * @returns {Promise<AdminToolSettings[]>} Array of enabled tool settings
 */
const getEnabledToolsForRole = async function (role) {
  try {
    const settings = await getAllToolSettings();
    return settings.filter(s => s.enabled && s.allowedRoles.includes(role));
  } catch (error) {
    logger.error('[getEnabledToolsForRole]', error);
    throw new Error(`Failed to get enabled tools for role: ${error.message}`);
  }
};

/**
 * Bulk update tool settings
 * @param {Array<{toolId: string, enabled?: boolean, order?: number}>} updates - Array of updates
 * @param {string} [userId] - The user ID making the updates
 * @returns {Promise<AdminToolSettings[]>} Updated tool settings
 */
const bulkUpdateToolSettings = async function (updates, userId) {
  try {
    const bulkOps = updates.map(({ toolId, enabled, order }) => {
      const setData = { updatedBy: userId };
      const unsetData = {};

      if (typeof enabled === 'boolean') {
        setData.enabled = enabled;
        if (!enabled) {
          setData.disabledBy = userId;
          setData.disabledAt = new Date();
        } else {
          unsetData.disabledBy = '';
          unsetData.disabledAt = '';
          unsetData.reason = '';
        }
      }

      if (typeof order === 'number') {
        setData.order = order;
      }

      const update = { $set: setData };
      if (Object.keys(unsetData).length > 0) {
        update.$unset = unsetData;
      }

      return {
        updateOne: {
          filter: { toolId },
          update,
          upsert: false,
        },
      };
    });

    await AdminToolSettings.bulkWrite(bulkOps);
    await clearToolSettingsCache();

    return await getAllToolSettings();
  } catch (error) {
    logger.error('[bulkUpdateToolSettings]', error);
    throw new Error(`Failed to bulk update tool settings: ${error.message}`);
  }
};

module.exports = {
  getAllToolSettings,
  getToolSetting,
  upsertToolSetting,
  toggleToolStatus,
  updateToolOrders,
  getEnabledToolsForRole,
  initializeDefaultToolSettings,
  clearToolSettingsCache,
  bulkUpdateToolSettings,
  DEFAULT_TOOLS,
};
