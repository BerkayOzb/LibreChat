const express = require('express');
const {
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
} = require('~/server/controllers/AdminToolController');
const requireJwtAuth = require('~/server/middleware/requireJwtAuth');
const { checkAdmin } = require('~/server/middleware/roles');

const router = express.Router();

// Apply authentication and admin role middleware to all routes
router.use(requireJwtAuth);
router.use(checkAdmin);

// GET /api/admin/tools - Get all tool settings with stats
router.get('/', getToolSettings);

// GET /api/admin/tools/defaults - Get default tool configurations
router.get('/defaults', getDefaults);

// PUT /api/admin/tools/reorder - Reorder tools
router.put('/reorder', reorderTools);

// PUT /api/admin/tools/bulk - Bulk update tools
router.put('/bulk', bulkUpdateTools);

// POST /api/admin/tools/clear-cache - Clear tool settings cache
router.post('/clear-cache', clearCache);

// POST /api/admin/tools/reset - Reset tool settings to defaults
router.post('/reset', resetToDefaults);

// GET /api/admin/tools/web-search/config - Get web search provider configuration
router.get('/web-search/config', getWebSearchConfig);

// PUT /api/admin/tools/web-search/config - Update web search provider configuration
router.put('/web-search/config', updateWebSearchConfig);

// GET /api/admin/tools/:toolId - Get single tool setting
router.get('/:toolId', getToolSettingById);

// PUT /api/admin/tools/:toolId - Update tool setting
router.put('/:toolId', updateToolSetting);

// PATCH /api/admin/tools/:toolId/toggle - Toggle tool enabled status
router.patch('/:toolId/toggle', toggleTool);

module.exports = router;
