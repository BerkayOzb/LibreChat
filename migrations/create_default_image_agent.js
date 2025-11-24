/**
 * Migration: Create Default Image Generator Agent
 *
 * Otomatik olarak "Görsel Üretici" agent'ını oluşturur
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
let AccessRole;
let SystemRoles;

async function initModels() {
  if (!Agent) {
    const { createModels } = require('@librechat/data-schemas');
    const models = createModels(mongoose);
    Agent = models.Agent;
    User = models.User;
    AclEntry = models.AclEntry;
    AccessRole = models.AccessRole;
    SystemRoles = require('librechat-data-provider').SystemRoles;
  }
}

async function createDefaultImageAgent() {
  try {
    logger.info('[Migration] Creating default Image Generator agent...');

    // Initialize models
    await initModels();

    // Find or create system user
    let systemUser = await User.findOne({
      email: 'system@veventures.local',
    });

    if (!systemUser) {
      logger.info('[Migration] System user not found, creating...');
      const bcrypt = require('bcryptjs');
      const crypto = require('crypto');
      const randomPassword = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);

      systemUser = await User.create({
        email: 'system@veventures.local',
        emailVerified: true,
        name: 'System',
        username: 'system',
        password: hashedPassword,
        provider: 'local',
        role: SystemRoles.ADMIN,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      logger.info('[Migration] System user created with ID:', systemUser._id);
    } else {
      logger.info('[Migration] Using existing system user:', systemUser._id);
    }

    // Check if agent already exists (with system user as author)
    const existingAgent = await Agent.findOne({
      name: 'Görsel Üretici',
      author: systemUser._id,
    });

    if (existingAgent) {
      logger.info('[Migration] Image Generator agent already exists, skipping...');
      return existingAgent;
    }

    // Generate unique agent ID
    const crypto = require('crypto');
    const agentId = 'agent_' + crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '').substring(0, 21);

    // Create the agent
    const imageAgent = await Agent.create({
      id: agentId,
      name: 'Görsel Üretici',
      description: 'Ultra-hızlı görsel üretimi için Nano Banana Pro kullanan agent',
      avatar: {
        filepath: null,
        source: 'default',
      },
      author: systemUser._id,
      model: 'openai/gpt-4o-mini',
      provider: 'AI Models',
      instructions: `Sen görsel üretim konusunda uzman bir AI asistanısın.

KRITIK KURALLAR:
1. SADECE "Nano-Banana-Pro" tool'unu kullan! ASLA "dalle" veya başka tool kullanma!
2. Görsel ürettikten sonra görseli ASLA analiz etme veya açıklama!
3. Sadece görselin hazır olduğunu söyle ve URL'i göster.

Kullanıcı görsel üretimi istediğinde:
1. İsteği detaylı İngilizce prompt'a çevir (minimum 2-3 cümle, görsel detaylar)
2. Nano-Banana-Pro tool'unu çağır
3. Görseli aldıktan sonra SADECe "Görselin hazır!" gibi kısa bir mesaj ver
4. ASLA görseli açıklamaya veya analiz etmeye çalışma!

Örnek iyi promptlar:
- "A cute cat sitting on a sunny windowsill, warm lighting, photorealistic, highly detailed"
- "Cyberpunk cityscape at night with neon signs, rain, reflections, moody atmosphere"
- "Mountain landscape at sunset, golden hour, dramatic clouds, professional photography"

ÖNEMLİ UYARI:
- Tool çağrısından sonra SADECE başarı mesajı ver
- Görseli görmeye veya açıklamaya ÇALIŞMA - senin modelim görsel göremez!`,
      tools: ['nano-banana'],
      capabilities: ['tools'],
      temperature: 0.7,
      top_p: 1,
      presence_penalty: 0,
      frequency_penalty: 0,
      // Make it accessible to all users
      permissions: {
        share: {
          isShared: true,
          isPublic: true,
          withUsers: [],
          withGroups: [],
          withRoles: [],
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    logger.info('[Migration] Default Image Generator agent created successfully!');
    logger.info(`[Migration] Agent ID: ${imageAgent._id}`);

    // Step 2: Grant ACL permissions
    logger.info('[Migration] Granting ACL permissions...');

    // Find access roles
    const viewerRole = await AccessRole.findOne({
      resourceType: 'agent',
      accessRoleId: 'agent_viewer',
    });

    const ownerRole = await AccessRole.findOne({
      resourceType: 'agent',
      accessRoleId: 'agent_owner',
    });

    if (!viewerRole || !ownerRole) {
      logger.error('[Migration] Could not find required access roles!');
      throw new Error('Access roles not found');
    }

    logger.info(`[Migration] Found roles - Viewer: ${viewerRole._id}, Owner: ${ownerRole._id}`);

    // Grant OWNER permission to system user
    await AclEntry.create({
      resourceId: imageAgent._id,
      principalType: 'user',
      principalId: systemUser._id,
      principalModel: 'User',
      resourceType: 'agent',
      permBits: 15, // Full permissions (VIEW + EDIT + DELETE + SHARE)
      roleId: ownerRole._id,
      grantedBy: systemUser._id,
      grantedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    });

    logger.info('[Migration] OWNER permission granted to system user');

    // Grant PUBLIC VIEW permission
    await AclEntry.create({
      resourceId: imageAgent._id,
      principalType: 'public', // ✅ Lowercase - schema requirement!
      principalId: systemUser._id, // Required by schema
      principalModel: 'User', // Required by schema
      resourceType: 'agent',
      permBits: 1, // VIEW permission only
      roleId: viewerRole._id,
      grantedBy: systemUser._id,
      grantedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      __v: 0,
    });

    logger.info('[Migration] PUBLIC VIEW permission granted');
    logger.info('[Migration] All permissions granted successfully!');

    return imageAgent;
  } catch (error) {
    logger.error('[Migration] Error creating default Image Generator agent:', error);
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
      await createDefaultImageAgent();
      logger.info('[Migration] Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('[Migration] MongoDB connection error:', error);
      process.exit(1);
    });
}

module.exports = { createDefaultImageAgent };
