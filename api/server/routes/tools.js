const express = require('express');
const { logger } = require('@librechat/data-schemas');
const { getEnabledToolsForRole, getAllToolSettings } = require('~/models/AdminToolSettings');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');

const router = express.Router();

/**
 * Get tool visibility for current user's role
 * @route GET /api/tools/visibility
 * @access Authenticated users
 */
router.get('/visibility', requireJwtAuth, async (req, res) => {
  try {
    const userRole = req.user?.role || 'USER';

    // Get all tool settings
    const allSettings = await getAllToolSettings();

    // Create visibility map based on user's role
    const visibility = {};
    for (const setting of allSettings) {
      // Tool is visible if it's enabled AND user's role is in allowedRoles
      const isVisible = setting.enabled && setting.allowedRoles.includes(userRole);
      visibility[setting.toolId] = {
        enabled: setting.enabled,
        visible: isVisible,
        allowedRoles: setting.allowedRoles,
      };
    }

    res.status(200).json({
      visibility,
      userRole,
    });
  } catch (error) {
    logger.error('[tools/visibility]', error);
    res.status(500).json({
      message: 'Error retrieving tool visibility',
      error: error.message,
    });
  }
});

/**
 * Get enabled tools for current user
 * @route GET /api/tools/enabled
 * @access Authenticated users
 */
router.get('/enabled', requireJwtAuth, async (req, res) => {
  try {
    const userRole = req.user?.role || 'USER';
    const enabledTools = await getEnabledToolsForRole(userRole);

    res.status(200).json({
      tools: enabledTools.map((t) => t.toolId),
      settings: enabledTools,
    });
  } catch (error) {
    logger.error('[tools/enabled]', error);
    res.status(500).json({
      message: 'Error retrieving enabled tools',
      error: error.message,
    });
  }
});

module.exports = router;
