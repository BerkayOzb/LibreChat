/**
 * Rollback: Remove Default Borsa Assistant Agent
 * Date: 2025-11-19
 *
 * "Borsa Asistanı" agent'ını veritabanından kaldırır
 */

const mongoose = require('mongoose');

const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
};

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

async function rollbackBorsaAgent() {
    try {
        logger.info('[Rollback] Removing Borsa Assistant agent...');

        await initModels();

        // Find system user
        const systemUser = await User.findOne({
            email: 'system@veventures.local',
        });

        if (!systemUser) {
            logger.info('[Rollback] System user not found, nothing to rollback');
            return;
        }

        // Find the agent
        const agent = await Agent.findOne({
            name: 'Borsa Asistanı',
            author: systemUser._id,
        });

        if (!agent) {
            logger.info('[Rollback] Borsa Assistant agent not found, nothing to rollback');
            return;
        }

        logger.info(`[Rollback] Found agent: ${agent._id}`);

        // Delete ACL entries
        const deletedAcls = await AclEntry.deleteMany({
            resourceId: agent._id,
            resourceType: 'agent',
        });

        logger.info(`[Rollback] Deleted ${deletedAcls.deletedCount} ACL entries`);

        // Delete the agent
        await Agent.deleteOne({ _id: agent._id });
        logger.info('[Rollback] Borsa Assistant agent deleted successfully');

    } catch (error) {
        logger.error('[Rollback] Error:', error);
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
            await rollbackBorsaAgent();
            logger.info('[Rollback] Rollback completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('[Rollback] MongoDB connection error:', error);
            process.exit(1);
        });
}

module.exports = { rollbackBorsaAgent };
