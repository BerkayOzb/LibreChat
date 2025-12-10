/**
 * Migration: Update ORG_ADMIN Role Permissions
 *
 * Updates the ORG_ADMIN role to have the same tool permissions as USER role.
 * This ensures ORG_ADMIN users can access chat tools like RUN_CODE, WEB_SEARCH, FILE_SEARCH etc.
 */

const mongoose = require('mongoose');

// Logger fallback
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

async function updateOrgAdminPermissions() {
  try {
    logger.info('[Migration] Updating ORG_ADMIN role permissions...');

    const db = mongoose.connection.db;
    const rolesCollection = db.collection('roles');

    // Define the updated permissions for ORG_ADMIN
    // Same as USER but with PEOPLE_PICKER access for org management
    const updatedPermissions = {
      PROMPTS: {
        SHARED_GLOBAL: false,
        USE: true,
        CREATE: true,
      },
      BOOKMARKS: {
        USE: true,
      },
      MEMORIES: {
        USE: true,
        CREATE: true,
        UPDATE: true,
        READ: true,
        OPT_OUT: true,
      },
      AGENTS: {
        SHARED_GLOBAL: false,
        USE: true,
        CREATE: true,
      },
      MULTI_CONVO: {
        USE: true,
      },
      TEMPORARY_CHAT: {
        USE: true,
      },
      RUN_CODE: {
        USE: true,
      },
      WEB_SEARCH: {
        USE: true,
      },
      PEOPLE_PICKER: {
        VIEW_USERS: true,
        VIEW_GROUPS: true,
        VIEW_ROLES: false,
      },
      MARKETPLACE: {
        USE: false,
      },
      FILE_SEARCH: {
        USE: true,
      },
      FILE_CITATIONS: {
        USE: true,
      },
    };

    // Check if ORG_ADMIN role exists
    const existingRole = await rolesCollection.findOne({ name: 'ORG_ADMIN' });

    if (!existingRole) {
      logger.info('[Migration] ORG_ADMIN role does not exist, creating...');
      await rolesCollection.insertOne({
        name: 'ORG_ADMIN',
        permissions: updatedPermissions,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      logger.info('[Migration] ORG_ADMIN role created with full permissions');
    } else {
      logger.info('[Migration] ORG_ADMIN role exists, updating permissions...');
      logger.info('[Migration] Current permissions:', JSON.stringify(existingRole.permissions, null, 2));

      await rolesCollection.updateOne(
        { name: 'ORG_ADMIN' },
        {
          $set: {
            permissions: updatedPermissions,
            updatedAt: new Date(),
          },
        }
      );

      logger.info('[Migration] ORG_ADMIN role permissions updated');
    }

    logger.info('[Migration] ORG_ADMIN permissions update completed!');
    return { success: true };
  } catch (error) {
    logger.error('[Migration] Error updating ORG_ADMIN permissions:', error);
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
      logger.info('[Migration] Connected to MongoDB');
      await updateOrgAdminPermissions();
      logger.info('[Migration] Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('[Migration] MongoDB connection error:', error);
      process.exit(1);
    });
}

module.exports = { updateOrgAdminPermissions };
