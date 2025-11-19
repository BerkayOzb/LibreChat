const { getUserPinnedModels, toggleModelPin } = require('~/models/UserModelPreferences');

/**
 * Get user's pinned models for endpoint and provider
 * @route GET /api/models/pinned/:endpoint/:provider
 */
const getPinnedModels = async (req, res) => {
  try {
    const { endpoint, provider } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!endpoint || !provider) {
      return res.status(400).json({ error: 'Endpoint and provider are required' });
    }

    const pinnedModels = await getUserPinnedModels(userId, endpoint, provider);
    res.json({ userId, endpoint, provider, pinnedModels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Toggle pin status for a model
 * @route POST /api/models/pin/:endpoint/:provider/:modelName
 */
const togglePin = async (req, res) => {
  try {
    const { endpoint, provider, modelName } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!endpoint || !provider || !modelName) {
      return res.status(400).json({ error: 'Endpoint, provider, and modelName are required' });
    }

    const result = await toggleModelPin(userId, endpoint, provider, modelName);
    res.json({
      success: true,
      message: result.isPinned ? 'Model pinned successfully' : 'Model unpinned successfully',
      isPinned: result.isPinned,
      pinnedModels: result.pinnedModels,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPinnedModels,
  togglePin,
};
