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
};
