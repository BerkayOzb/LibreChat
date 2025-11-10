/**
 * Rollback Migration: Remove Agent Permissions (ACL Entries)
 *
 * Agent permissions migration'ını geri alır
 */

const mongoose = require('mongoose');

// Logger fallback
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
};

// ACL Entry Schema
const aclEntrySchema = new mongoose.Schema({
  principalType: { type: String, required: true },
  principalId: { type: mongoose.Schema.Types.ObjectId },
  resourceType: { type: String, required: true },
  resourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  accessRoleId: { type: String, required: true },
  grantedBy: { type: mongoose.Schema.Types.ObjectId },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const ACLEntry = mongoose.models.ACLEntry || mongoose.model('ACLEntry', aclEntrySchema, 'aclentries');

async function rollbackAgentPermissions({ dryRun = true } = {}) {
  try {
    logger.info('[Rollback] Starting agent permissions rollback...', { dryRun });

    // Find all ACL entries for agents
    const agentAclEntries = await ACLEntry.find({
      resourceType: 'agent',
    });

    logger.info(`[Rollback] Found ${agentAclEntries.length} agent ACL entries`);

    if (dryRun) {
      logger.info('[Rollback] DRY RUN - Would delete the following:');
      const summary = {
        userPermissions: 0,
        publicPermissions: 0,
        total: agentAclEntries.length,
      };

      agentAclEntries.forEach((entry) => {
        if (entry.principalType === 'user') {
          summary.userPermissions++;
        } else if (entry.principalType === 'public') {
          summary.publicPermissions++;
        }
      });

      logger.info(`[Rollback] Summary:`, summary);
      return { deleted: 0, dryRun: true, summary };
    }

    // Actually delete the ACL entries
    const result = await ACLEntry.deleteMany({
      resourceType: 'agent',
    });

    logger.info(`[Rollback] Deleted ${result.deletedCount} agent ACL entries`);

    return { deleted: result.deletedCount, dryRun: false };
  } catch (error) {
    logger.error('[Rollback] Error during agent permissions rollback:', error);
    throw error;
  }
}

// CLI execution
if (require.main === module) {
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
  const dryRun = process.argv.includes('--dry-run');

  mongoose
    .connect(MONGO_URI, {
      bufferCommands: false,
      autoIndex: false,
      autoCreate: false,
    })
    .then(async () => {
      logger.info('[Rollback] Connected to MongoDB');
      const result = await rollbackAgentPermissions({ dryRun });

      if (dryRun) {
        logger.info('[Rollback] DRY RUN completed. Run without --dry-run to actually delete.');
      } else {
        logger.info('[Rollback] Rollback completed successfully');
      }

      process.exit(0);
    })
    .catch((error) => {
      logger.error('[Rollback] MongoDB connection error:', error);
      process.exit(1);
    });
}

module.exports = { rollbackAgentPermissions };
