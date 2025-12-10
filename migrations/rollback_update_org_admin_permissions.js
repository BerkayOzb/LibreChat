/**
 * Rollback Migration: Revert ORG_ADMIN Role Permissions
 *
 * Reverts ORG_ADMIN role permissions to previous state (minimal permissions).
 */

const mongoose = require('mongoose');

// Logger fallback
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

async function rollbackOrgAdminPermissions() {
  try {
    logger.info('[Rollback] Reverting ORG_ADMIN role permissions...');

    const db = mongoose.connection.db;
    const rolesCollection = db.collection('roles');

    // Original minimal permissions for ORG_ADMIN
    const originalPermissions = {
      PROMPTS: {},
      BOOKMARKS: {},
      MEMORIES: {},
      AGENTS: {},
      MULTI_CONVO: {},
      TEMPORARY_CHAT: {},
      RUN_CODE: {},
      WEB_SEARCH: {},
      PEOPLE_PICKER: {
        VIEW_USERS: true,
        VIEW_GROUPS: true,
        VIEW_ROLES: false,
      },
      MARKETPLACE: {
        USE: false,
      },
      FILE_SEARCH: {},
      FILE_CITATIONS: {},
    };

    const existingRole = await rolesCollection.findOne({ name: 'ORG_ADMIN' });

    if (!existingRole) {
      logger.info('[Rollback] ORG_ADMIN role does not exist, nothing to rollback');
      return { success: true, message: 'Role not found' };
    }

    logger.info('[Rollback] Current permissions:', JSON.stringify(existingRole.permissions, null, 2));

    await rolesCollection.updateOne(
      { name: 'ORG_ADMIN' },
      {
        $set: {
          permissions: originalPermissions,
          updatedAt: new Date(),
        },
      }
    );

    logger.info('[Rollback] ORG_ADMIN role permissions reverted to original state');
    return { success: true };
  } catch (error) {
    logger.error('[Rollback] Error reverting ORG_ADMIN permissions:', error);
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
      await rollbackOrgAdminPermissions();
      logger.info('[Rollback] Rollback completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('[Rollback] MongoDB connection error:', error);
      process.exit(1);
    });
}

module.exports = { rollbackOrgAdminPermissions };
