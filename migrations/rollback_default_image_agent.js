/**
 * Rollback Migration: Remove Default Image Generator Agent
 *
 * "Görsel Üretici" agent'ını kaldırır
 */

const mongoose = require('mongoose');

// Logger fallback
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

// Agent Model Definition (inline to avoid path issues)
const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  avatar: {
    filepath: String,
    source: String,
  },
  author: { type: String, required: true },
  model: { type: String, required: true },
  provider: { type: String, required: true },
  instructions: { type: String },
  tools: [{ type: String }],
  capabilities: [{ type: String }],
  temperature: { type: Number },
  top_p: { type: Number },
  presence_penalty: { type: Number },
  frequency_penalty: { type: Number },
  permissions: {
    share: {
      isShared: { type: Boolean, default: false },
      isPublic: { type: Boolean, default: false },
      withUsers: [{ type: String }],
      withGroups: [{ type: String }],
      withRoles: [{ type: String }],
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);

async function rollbackDefaultImageAgent() {
  try {
    logger.info('[Rollback] Removing default Image Generator agent...');

    // Find and delete the agent
    const result = await Agent.deleteOne({
      name: 'Görsel Üretici',
      author: 'System',
    });

    if (result.deletedCount === 0) {
      logger.info('[Rollback] Image Generator agent not found, nothing to rollback.');
      return null;
    }

    logger.info('[Rollback] Default Image Generator agent removed successfully!');
    logger.info(`[Rollback] Deleted ${result.deletedCount} agent(s)`);

    return result;
  } catch (error) {
    logger.error('[Rollback] Error removing default Image Generator agent:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';

  mongoose
    .connect(MONGO_URI, {
      bufferCommands: false,
      autoIndex: false,
      autoCreate: false,
    })
    .then(async () => {
      logger.info('[Rollback] Connected to MongoDB');
      await rollbackDefaultImageAgent();
      logger.info('[Rollback] Rollback completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('[Rollback] MongoDB connection error:', error);
      process.exit(1);
    });
}

module.exports = { rollbackDefaultImageAgent };
