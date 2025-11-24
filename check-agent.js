/**
 * Agent Kontrol ve Silme Aracı
 * Kullanım:
 *   node check-agent.js list              - Tüm agent'ları listele
 *   node check-agent.js find "Agent Name" - Belirli agent'ı ara
 *   node check-agent.js delete "Agent ID" - Agent'ı sil
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Logger
const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    success: (...args) => console.log('\x1b[32m[SUCCESS]\x1b[0m', ...args),
    warn: (...args) => console.warn('\x1b[33m[WARN]\x1b[0m', ...args),
};

// Import models
let Agent;
let AclEntry;

async function initModels() {
    if (!Agent) {
        const { createModels } = require('@librechat/data-schemas');
        const models = createModels(mongoose);
        Agent = models.Agent;
        AclEntry = models.AclEntry;
    }
}

async function listAgents() {
    try {
        await initModels();

        const agents = await Agent.find({})
            .populate('author', 'name email')
            .select('id name description author createdAt')
            .lean();

        if (agents.length === 0) {
            logger.info('Veritabanında hiç agent bulunamadı.');
            return;
        }

        logger.info(`\nToplam ${agents.length} agent bulundu:\n`);
        agents.forEach((agent, index) => {
            console.log(`${index + 1}. Agent:`);
            console.log(`   ID: ${agent.id}`);
            console.log(`   MongoDB _id: ${agent._id}`);
            console.log(`   İsim: ${agent.name}`);
            console.log(`   Açıklama: ${agent.description || 'Yok'}`);
            console.log(`   Oluşturan: ${agent.author?.name || agent.author?.email || 'Bilinmiyor'}`);
            console.log(`   Oluşturma Tarihi: ${agent.createdAt}`);
            console.log('');
        });

    } catch (error) {
        logger.error('Agent listesi alınırken hata:', error);
        throw error;
    }
}

async function findAgent(searchTerm) {
    try {
        await initModels();

        // İsme veya ID'ye göre ara
        const query = {
            $or: [
                { name: new RegExp(searchTerm, 'i') },
                { id: searchTerm }
            ]
        };

        // Eğer searchTerm valid ObjectId ise _id'ye göre de ara
        if (mongoose.Types.ObjectId.isValid(searchTerm)) {
            query.$or.push({ _id: searchTerm });
        }

        const agents = await Agent.find(query)
        .populate('author', 'name email')
        .lean();

        if (agents.length === 0) {
            logger.warn(`"${searchTerm}" ile eşleşen agent bulunamadı.`);
            return null;
        }

        logger.success(`\n${agents.length} agent bulundu:\n`);
        agents.forEach((agent, index) => {
            console.log(`${index + 1}. Agent:`);
            console.log(`   ID: ${agent.id}`);
            console.log(`   MongoDB _id: ${agent._id}`);
            console.log(`   İsim: ${agent.name}`);
            console.log(`   Açıklama: ${agent.description || 'Yok'}`);
            console.log(`   Oluşturan: ${agent.author?.name || agent.author?.email || 'Bilinmiyor'}`);
            console.log(`   Model: ${agent.model || 'Belirtilmemiş'}`);
            console.log(`   Provider: ${agent.provider || 'Belirtilmemiş'}`);
            console.log(`   Tool Sayısı: ${agent.tools?.length || 0}`);
            console.log(`   Oluşturma Tarihi: ${agent.createdAt}`);
            console.log('');
        });

        return agents;

    } catch (error) {
        logger.error('Agent aranırken hata:', error);
        throw error;
    }
}

async function deleteAgent(agentId) {
    try {
        await initModels();

        // Önce agent'ı bul
        const query = {
            $or: [
                { id: agentId }
            ]
        };

        // Eğer agentId valid ObjectId ise _id'ye göre de ara
        if (mongoose.Types.ObjectId.isValid(agentId)) {
            query.$or.push({ _id: agentId });
        }

        const agent = await Agent.findOne(query);

        if (!agent) {
            logger.error(`Agent bulunamadı: ${agentId}`);
            return;
        }

        logger.info(`\nAgent bilgileri:`);
        logger.info(`   ID: ${agent.id}`);
        logger.info(`   İsim: ${agent.name}`);
        logger.info(`   MongoDB _id: ${agent._id}`);

        // ACL izinlerini sil
        const aclCount = await AclEntry.countDocuments({
            resourceId: agent._id,
            resourceType: 'agent'
        });

        if (aclCount > 0) {
            logger.info(`\n${aclCount} ACL kaydı siliniyor...`);
            await AclEntry.deleteMany({
                resourceId: agent._id,
                resourceType: 'agent'
            });
            logger.success(`${aclCount} ACL kaydı silindi.`);
        }

        // Agent'ı sil
        await Agent.deleteOne({ _id: agent._id });
        logger.success(`\nAgent başarıyla silindi: ${agent.name}`);

    } catch (error) {
        logger.error('Agent silinirken hata:', error);
        throw error;
    }
}

// Main
async function main() {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/LibreChat';
    const args = process.argv.slice(2);

    if (args.length === 0) {
        console.log(`
Kullanım:
  node check-agent.js list                  - Tüm agent'ları listele
  node check-agent.js find "Agent Name"     - Belirli agent'ı ara
  node check-agent.js delete "Agent ID"     - Agent'ı sil (ID veya MongoDB _id)

Örnekler:
  node check-agent.js list
  node check-agent.js find "Test Agent"
  node check-agent.js delete "agent_abc123xyz"
  node check-agent.js delete "507f1f77bcf86cd799439011"
        `);
        process.exit(0);
    }

    const command = args[0];
    const param = args[1];

    try {
        await mongoose.connect(MONGO_URI, {
            bufferCommands: false,
            autoIndex: false,
            autoCreate: false,
        });

        logger.info('MongoDB bağlantısı başarılı');

        switch (command) {
            case 'list':
                await listAgents();
                break;

            case 'find':
                if (!param) {
                    logger.error('Arama terimi belirtilmedi!');
                    logger.info('Kullanım: node check-agent.js find "Agent Name"');
                    process.exit(1);
                }
                await findAgent(param);
                break;

            case 'delete':
                if (!param) {
                    logger.error('Agent ID belirtilmedi!');
                    logger.info('Kullanım: node check-agent.js delete "agent_id"');
                    process.exit(1);
                }
                await deleteAgent(param);
                break;

            default:
                logger.error(`Bilinmeyen komut: ${command}`);
                logger.info('Geçerli komutlar: list, find, delete');
                process.exit(1);
        }

        process.exit(0);

    } catch (error) {
        logger.error('İşlem hatası:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { listAgents, findAgent, deleteAgent };
