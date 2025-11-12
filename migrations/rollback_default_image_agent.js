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

// Import models dynamically
let Agent;
let User;
let AclEntry;

async function initModels() {
  if (!Agent) {
    const { createModels } = require('@librechat/data-schemas');
    const models = createModels(mongoose);
    Agent = models.Agent;
    User = models.User;
    AclEntry = models.AclEntry;
  }
}

async function rollbackDefaultImageAgent() {
  try {
    logger.info('[Rollback] Removing default Image Generator agent...');

    // Initialize models
    await initModels();

    // Find system user
    const systemUser = await User.findOne({
      email: 'system@veventures.local',
    });

    // Find the agent first to get its ID for ACL cleanup
    // Use name-only query first to avoid ObjectId casting issues
    const agents = await Agent.find({
      name: 'Görsel Üretici',
    });

    // Filter to find our agent (either by system user or any match)
    let agent = null;
    if (agents.length > 0) {
      if (systemUser) {
        // Try to find by system user first
        agent = agents.find(a => a.author && a.author.toString() === systemUser._id.toString());
      }
      // If not found or no system user, just take the first one
      if (!agent) {
        agent = agents[0];
      }
    }

    if (!agent) {
      logger.info('[Rollback] Image Generator agent not found, nothing to rollback.');
      return null;
    }

    // Delete ACL entries for this specific agent
    const aclResult = await AclEntry.deleteMany({
      resourceId: agent._id,
      resourceType: 'agent',
    });

    logger.info(`[Rollback] Deleted ${aclResult.deletedCount} ACL entries for agent`);

    // Now delete the agent
    const result = await Agent.deleteOne({ _id: agent._id });

    logger.info('[Rollback] Default Image Generator agent removed successfully!');
    logger.info(`[Rollback] Deleted agent and ${aclResult.deletedCount} ACL entries`);

    return { deletedCount: result.deletedCount, aclDeleted: aclResult.deletedCount };
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
