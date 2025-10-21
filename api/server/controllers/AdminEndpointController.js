const { logger } = require('@librechat/data-schemas');
const { SystemRoles } = require('librechat-data-provider');
const { 
  getAllEndpointSettings,
  getEndpointSetting,
  upsertEndpointSetting,
  toggleEndpointStatus,
  updateEndpointOrders,
  getEnabledEndpointsForRole,
  initializeDefaultEndpointSettings,
  clearEndpointSettingsCache,
  removeDuplicateEndpoints,
} = require('~/models/AdminEndpointSettings');

/**
 * Get all endpoint settings with statistics
 * @route GET /api/admin/endpoints
 * @access Admin
 */
const getEndpointSettings = async (req, res) => {
  try {
    const settings = await getAllEndpointSettings();
    
    const stats = {
      total: settings.length,
      enabled: settings.filter(s => s.enabled).length,
      disabled: settings.filter(s => !s.enabled).length,
    };

    res.status(200).json({
      settings,
      stats,
      message: 'Endpoint settings retrieved successfully'
    });
  } catch (error) {
    logger.error('[getEndpointSettings]', error);
    res.status(500).json({ 
      message: 'Error retrieving endpoint settings',
      error: error.message 
    });
  }
};

/**
 * Get single endpoint setting
 * @route GET /api/admin/endpoints/:endpoint
 * @access Admin
 */
const getEndpointSettingById = async (req, res) => {
  try {
    const { endpoint } = req.params;
    
    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint parameter is required' });
    }

    const setting = await getEndpointSetting(endpoint);
    
    if (!setting) {
      return res.status(404).json({ message: 'Endpoint setting not found' });
    }

    res.status(200).json({
      setting,
      message: 'Endpoint setting retrieved successfully'
    });
  } catch (error) {
    logger.error('[getEndpointSettingById]', error);
    res.status(500).json({ 
      message: 'Error retrieving endpoint setting',
      error: error.message 
    });
  }
};

/**
 * Create or update endpoint setting
 * @route PUT /api/admin/endpoints/:endpoint
 * @access Admin
 */
const updateEndpointSetting = async (req, res) => {
  try {
    const { endpoint } = req.params;
    const { enabled, allowedRoles, order, description, metadata } = req.body;
    const userId = req.user.id;

    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint parameter is required' });
    }

    // Validate allowed roles
    if (allowedRoles && Array.isArray(allowedRoles)) {
      const validRoles = Object.values(SystemRoles);
      const invalidRoles = allowedRoles.filter(role => !validRoles.includes(role));
      if (invalidRoles.length > 0) {
        return res.status(400).json({ 
          message: `Invalid roles: ${invalidRoles.join(', ')}. Valid roles are: ${validRoles.join(', ')}` 
        });
      }
    }

    const settingData = {
      endpoint,
      ...(typeof enabled === 'boolean' && { enabled }),
      ...(allowedRoles && { allowedRoles }),
      ...(typeof order === 'number' && { order }),
      ...(description !== undefined && { description }),
      ...(metadata && { metadata }),
    };

    const updatedSetting = await upsertEndpointSetting(endpoint, settingData, userId);

    res.status(200).json({
      setting: updatedSetting,
      message: 'Endpoint setting updated successfully'
    });
  } catch (error) {
    logger.error('[updateEndpointSetting]', error);
    res.status(500).json({ 
      message: 'Error updating endpoint setting',
      error: error.message 
    });
  }
};

/**
 * Toggle endpoint enabled status
 * @route POST /api/admin/endpoints/:endpoint/toggle
 * @access Admin
 */
const toggleEndpoint = async (req, res) => {
  try {
    const { endpoint } = req.params;
    const { enabled } = req.body;
    const userId = req.user.id;

    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint parameter is required' });
    }

    if (typeof enabled !== 'boolean') {
      return res.status(400).json({ message: 'Enabled parameter must be a boolean' });
    }

    const updatedSetting = await toggleEndpointStatus(endpoint, enabled, userId);

    res.status(200).json({
      setting: updatedSetting,
      message: `Endpoint ${enabled ? 'enabled' : 'disabled'} successfully`
    });
  } catch (error) {
    logger.error('[toggleEndpoint]', error);
    res.status(500).json({ 
      message: 'Error toggling endpoint status',
      error: error.message 
    });
  }
};

/**
 * Update multiple endpoint orders
 * @route POST /api/admin/endpoints/reorder
 * @access Admin
 */
const reorderEndpoints = async (req, res) => {
  try {
    const { updates } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Updates array is required and cannot be empty' });
    }

    // Validate update structure
    for (const update of updates) {
      if (!update.endpoint || typeof update.order !== 'number') {
        return res.status(400).json({ 
          message: 'Each update must have endpoint (string) and order (number) properties' 
        });
      }
    }

    const updatedCount = await updateEndpointOrders(updates, userId);

    res.status(200).json({
      updatedCount,
      message: `Successfully updated order for ${updatedCount} endpoints`
    });
  } catch (error) {
    logger.error('[reorderEndpoints]', error);
    res.status(500).json({ 
      message: 'Error reordering endpoints',
      error: error.message 
    });
  }
};

/**
 * Get enabled endpoints for a specific role
 * @route GET /api/admin/endpoints/role/:role
 * @access Admin
 */
const getEndpointsForRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (!role) {
      return res.status(400).json({ message: 'Role parameter is required' });
    }

    const validRoles = Object.values(SystemRoles);
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        message: `Invalid role: ${role}. Valid roles are: ${validRoles.join(', ')}` 
      });
    }

    const enabledEndpoints = await getEnabledEndpointsForRole(role);

    res.status(200).json({
      role,
      endpoints: enabledEndpoints,
      count: enabledEndpoints.length,
      message: `Enabled endpoints for role ${role} retrieved successfully`
    });
  } catch (error) {
    logger.error('[getEndpointsForRole]', error);
    res.status(500).json({ 
      message: 'Error retrieving endpoints for role',
      error: error.message 
    });
  }
};

/**
 * Initialize default endpoint settings
 * @route POST /api/admin/endpoints/initialize
 * @access Admin
 */
const initializeEndpoints = async (req, res) => {
  try {
    const { defaultEndpoints } = req.body;

    if (!Array.isArray(defaultEndpoints) || defaultEndpoints.length === 0) {
      return res.status(400).json({ message: 'Default endpoints array is required' });
    }

    const initializedCount = await initializeDefaultEndpointSettings(defaultEndpoints);

    res.status(200).json({
      initializedCount,
      message: `Successfully initialized ${initializedCount} default endpoint settings`
    });
  } catch (error) {
    logger.error('[initializeEndpoints]', error);
    res.status(500).json({ 
      message: 'Error initializing endpoint settings',
      error: error.message 
    });
  }
};

/**
 * Clear endpoint settings cache
 * @route POST /api/admin/endpoints/cache/clear
 * @access Admin
 */
const clearCache = async (req, res) => {
  try {
    const cleared = await clearEndpointSettingsCache();

    res.status(200).json({
      cleared,
      message: cleared ? 'Cache cleared successfully' : 'Cache was already empty'
    });
  } catch (error) {
    logger.error('[clearCache]', error);
    res.status(500).json({ 
      message: 'Error clearing cache',
      error: error.message 
    });
  }
};

/**
 * Remove duplicate endpoint settings
 * @route POST /api/admin/endpoints/cleanup
 * @access Admin
 */
const cleanupDuplicates = async (req, res) => {
  try {
    const removedCount = await removeDuplicateEndpoints();

    res.status(200).json({
      removedCount,
      message: `Successfully removed ${removedCount} duplicate endpoints`
    });
  } catch (error) {
    logger.error('[cleanupDuplicates]', error);
    res.status(500).json({ 
      message: 'Error cleaning up duplicates',
      error: error.message 
    });
  }
};

/**
 * Bulk update endpoint settings
 * @route POST /api/admin/endpoints/bulk
 * @access Admin
 */
const bulkUpdateEndpoints = async (req, res) => {
  try {
    const { updates } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'Updates array is required and cannot be empty' });
    }

    const results = [];
    const errors = [];

    for (const update of updates) {
      try {
        if (!update.endpoint) {
          errors.push({ endpoint: 'unknown', error: 'Endpoint name is required' });
          continue;
        }

        const settingData = {
          endpoint: update.endpoint,
          ...(typeof update.enabled === 'boolean' && { enabled: update.enabled }),
          ...(update.allowedRoles && { allowedRoles: update.allowedRoles }),
          ...(typeof update.order === 'number' && { order: update.order }),
          ...(update.description !== undefined && { description: update.description }),
          ...(update.metadata && { metadata: update.metadata }),
        };

        const updatedSetting = await upsertEndpointSetting(update.endpoint, settingData, userId);
        results.push({
          endpoint: update.endpoint,
          status: 'success',
          setting: updatedSetting
        });
      } catch (error) {
        errors.push({
          endpoint: update.endpoint,
          error: error.message
        });
      }
    }

    res.status(200).json({
      results,
      errors,
      successCount: results.length,
      errorCount: errors.length,
      message: `Bulk update completed: ${results.length} successful, ${errors.length} failed`
    });
  } catch (error) {
    logger.error('[bulkUpdateEndpoints]', error);
    res.status(500).json({ 
      message: 'Error performing bulk update',
      error: error.message 
    });
  }
};

module.exports = {
  getEndpointSettings,
  getEndpointSettingById,
  updateEndpointSetting,
  toggleEndpoint,
  cleanupDuplicates,
  reorderEndpoints,
  getEndpointsForRole,
  initializeEndpoints,
  clearCache,
  bulkUpdateEndpoints,
};