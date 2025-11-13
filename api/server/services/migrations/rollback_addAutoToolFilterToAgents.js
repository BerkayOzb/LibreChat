const { logger } = require('@librechat/data-schemas');
const { Agent } = require('~/db/models');

/**
 * Rollback Migration: Remove autoToolFilter and availableTools fields from agents
 *
 * This rollback:
 * 1. Removes autoToolFilter field from all agents
 * 2. Removes availableTools field from all agents
 *
 * Use this if you need to revert the autoToolFilter feature
 *
 * WARNING: This will remove all autoToolFilter configurations.
 * Make sure to backup your database before running this rollback!
 */
async function rollbackAddAutoToolFilterToAgents() {
  try {
    logger.info('[Rollback] Starting: Remove autoToolFilter from agents');

    // Count agents that have these fields
    const agentsToRollback = await Agent.countDocuments({
      $or: [{ autoToolFilter: { $exists: true } }, { availableTools: { $exists: true } }],
    });

    if (agentsToRollback === 0) {
      logger.info('[Rollback] No agents need rollback, skipping');
      return {
        success: true,
        rolledBack: 0,
        message: 'No agents needed rollback',
      };
    }

    logger.info('[Rollback] Found agents to rollback', { count: agentsToRollback });

    // Remove the fields from all agents
    const result = await Agent.updateMany(
      {
        $or: [{ autoToolFilter: { $exists: true } }, { availableTools: { $exists: true } }],
      },
      {
        $unset: {
          autoToolFilter: '',
          availableTools: '',
        },
      },
    );

    logger.info('[Rollback] Completed: Remove autoToolFilter from agents', {
      matched: result.matchedCount,
      modified: result.modifiedCount,
    });

    return {
      success: true,
      rolledBack: result.modifiedCount,
      message: `Successfully rolled back ${result.modifiedCount} agents`,
    };
  } catch (error) {
    logger.error('[Rollback] Failed: Remove autoToolFilter from agents', {
      error: error.message,
      stack: error.stack,
    });
    return {
      success: false,
      error: error.message,
      message: 'Rollback failed',
    };
  }
}

/**
 * Run rollback if this file is executed directly
 */
if (require.main === module) {
  (async () => {
    const mongoose = require('mongoose');
    const { connectDb } = require('~/config/db');

    try {
      // Ask for confirmation
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });

      rl.question(
        'WARNING: This will remove autoToolFilter and availableTools from ALL agents. Continue? (yes/no): ',
        async (answer) => {
          rl.close();

          if (answer.toLowerCase() !== 'yes') {
            console.log('Rollback cancelled');
            process.exit(0);
          }

          await connectDb();
          const result = await rollbackAddAutoToolFilterToAgents();
          console.log('Rollback result:', result);
          process.exit(result.success ? 0 : 1);
        },
      );
    } catch (error) {
      console.error('Rollback failed:', error);
      process.exit(1);
    } finally {
      await mongoose.connection.close();
    }
  })();
}

module.exports = {
  rollbackAddAutoToolFilterToAgents,
};
