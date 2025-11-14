const { logger } = require('@librechat/data-schemas');
const { Agent } = require('~/db/models');

/**
 * Migration: Add autoToolFilter and availableTools fields to existing agents
 *
 * This migration:
 * 1. Adds autoToolFilter: false to all existing agents (backward compatible)
 * 2. Sets availableTools to undefined (will fallback to tools array)
 *
 * This ensures backward compatibility while enabling the new feature for future agents
 *
 * Rollback script is provided in: rollback_addAutoToolFilterToAgents.js
 */
async function addAutoToolFilterToAgents() {
  try {
    logger.info('[Migration] Starting: Add autoToolFilter to agents');

    // Count agents that need migration
    const agentsToMigrate = await Agent.countDocuments({
      $or: [{ autoToolFilter: { $exists: false } }, { availableTools: { $exists: false } }],
    });

    if (agentsToMigrate === 0) {
      logger.info('[Migration] No agents need migration, skipping');
      return {
        success: true,
        migrated: 0,
        message: 'No agents needed migration',
      };
    }

    logger.info('[Migration] Found agents to migrate', { count: agentsToMigrate });

    // Update all agents that don't have these fields
    const result = await Agent.updateMany(
      {
        $or: [{ autoToolFilter: { $exists: false } }, { availableTools: { $exists: false } }],
      },
      {
        $set: {
          autoToolFilter: false, // Disabled by default for backward compatibility
          availableTools: undefined, // Will fallback to tools array
        },
      },
    );

    logger.info('[Migration] Completed: Add autoToolFilter to agents', {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });

    return {
      success: true,
      migrated: result.modifiedCount,
      message: `Successfully migrated ${result.modifiedCount} agents`,
    };
  } catch (error) {
    logger.error('[Migration] Failed: Add autoToolFilter to agents', {
      error: error.message,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message,
      message: 'Migration failed',
    };
  }
}

/**
 * Run migration if this file is executed directly
 */
if (require.main === module) {
  (async () => {
    const mongoose = require('mongoose');
    const { connectDb } = require('~/config/db');

    try {
      await connectDb();
      const result = await addAutoToolFilterToAgents();
      console.log('Migration result:', result);
      process.exit(result.success ? 0 : 1);
    } catch (error) {
      console.error('Migration failed:', error);
      process.exit(1);
    } finally {
      await mongoose.connection.close();
    }
  })();
}

module.exports = {
  addAutoToolFilterToAgents,
};
