/**
 * Rollback Migration: Remove Default Image Generator Agent
 *
 * Safely removes the "Görsel Üretici" agent, its ACL permissions,
 * and the system user that was created for it.
 */

const mongoose = require('mongoose');

// Logger fallback
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
};

async function rollbackDefaultImageAgent() {
  try {
    logger.info('[Rollback] Starting rollback of default Image Generator agent...');

    // Get database connections
    const Agent = mongoose.model('Agent');
    const User = mongoose.model('User');
    const AclEntry = mongoose.model('AclEntry');
    const Project = mongoose.model('Project');

    // Find the system user
    const systemUser = await User.findOne({ email: 'system@librechat.local' });
    if (!systemUser) {
      logger.warn('[Rollback] System user not found, may have been already removed');
      return;
    }

    // Find the agent
    const agent = await Agent.findOne({
      name: 'Görsel Üretici',
      author: systemUser._id,
    });

    if (!agent) {
      logger.warn('[Rollback] Image Generator agent not found, may have been already removed');
      // Still try to clean up system user if it exists
      await User.deleteOne({ _id: systemUser._id });
      logger.info('[Rollback] System user removed');
      return;
    }

    logger.info(`[Rollback] Found agent with ID: ${agent.id}`);

    // Remove from global project
    try {
      await Project.updateOne(
        { name: 'instance' },
        { $pull: { agentIds: agent.id } }
      );
      logger.info('[Rollback] Agent removed from global project');
    } catch (projectError) {
      logger.warn('[Rollback] Could not remove from global project:', projectError.message);
    }

    // Remove ACL permissions
    try {
      const aclResult = await AclEntry.deleteMany({
        resourceId: agent._id,
        resourceType: 'agent',
      });
      logger.info(`[Rollback] Removed ${aclResult.deletedCount} ACL entries`);
    } catch (aclError) {
      logger.warn('[Rollback] Could not remove ACL entries:', aclError.message);
    }

    // Remove the agent
    await Agent.deleteOne({ _id: agent._id });
    logger.info('[Rollback] Agent deleted');

    // Check if system user has any other agents
    const otherAgents = await Agent.findOne({ author: systemUser._id });
    if (!otherAgents) {
      // Safe to remove system user
      await User.deleteOne({ _id: systemUser._id });
      logger.info('[Rollback] System user removed (no other agents)');
    } else {
      logger.info('[Rollback] System user kept (has other agents)');
    }

    logger.info('[Rollback] Default Image Generator agent rollback complete!');

  } catch (error) {
    logger.error('[Rollback] Error during rollback:', error);
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
