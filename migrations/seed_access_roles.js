/**
 * Migration: Seed Access Roles
 *
 * Creates the required AccessRole records for the LibreChat ACL system
 */

const mongoose = require('mongoose');

// Logger fallback
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
};

// Import models dynamically
let AccessRole;

async function initModels() {
  if (!AccessRole) {
    const { createModels } = require('@librechat/data-schemas');
    const models = createModels(mongoose);
    AccessRole = models.AccessRole;
  }
}

async function seedAccessRoles() {
  try {
    logger.info('[Migration] Seeding AccessRole records...');

    // Initialize models
    await initModels();

    // Define the access roles to create
    const rolesToCreate = [
      {
        resourceType: 'agent',
        accessRoleId: 'agent_viewer',
        name: 'Agent Viewer',
        description: 'Can view agents',
        permissions: ['view'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        resourceType: 'agent',
        accessRoleId: 'agent_owner',
        name: 'Agent Owner',
        description: 'Full control over agents',
        permissions: ['view', 'edit', 'delete', 'share'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        resourceType: 'prompt',
        accessRoleId: 'prompt_viewer',
        name: 'Prompt Viewer',
        description: 'Can view prompts',
        permissions: ['view'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        resourceType: 'prompt',
        accessRoleId: 'prompt_owner',
        name: 'Prompt Owner',
        description: 'Full control over prompts',
        permissions: ['view', 'edit', 'delete', 'share'],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const roleData of rolesToCreate) {
      // Check if role already exists
      const existingRole = await AccessRole.findOne({
        resourceType: roleData.resourceType,
        accessRoleId: roleData.accessRoleId,
      });

      if (existingRole) {
        logger.info(
          `[Migration] AccessRole already exists: ${roleData.accessRoleId} (${existingRole._id})`,
        );
        skipped++;
        continue;
      }

      // Create the role
      const newRole = await AccessRole.create(roleData);
      logger.info(`[Migration] Created AccessRole: ${roleData.accessRoleId} (${newRole._id})`);
      created++;
    }

    logger.info('[Migration] AccessRole seeding completed!');
    logger.info(`[Migration] Created: ${created}, Skipped: ${skipped}`);

    return { created, skipped };
  } catch (error) {
    logger.error('[Migration] Error seeding AccessRole records:', error);
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
      await seedAccessRoles();
      logger.info('[Migration] Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('[Migration] MongoDB connection error:', error);
      process.exit(1);
    });
}

module.exports = { seedAccessRoles };
