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

// Agent Model Definition (inline to avoid path issues)
const agentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  avatar: {
    filepath: String,
    source: String,
  },
  author: { type: String, required: true },
  model: { type: String, required: true },
  provider: { type: String, required: true },
  instructions: { type: String },
  tools: [{ type: String }],
  capabilities: [{ type: String }],
  temperature: { type: Number },
  top_p: { type: Number },
  presence_penalty: { type: Number },
  frequency_penalty: { type: Number },
  permissions: {
    share: {
      isShared: { type: Boolean, default: false },
      isPublic: { type: Boolean, default: false },
      withUsers: [{ type: String }],
      withGroups: [{ type: String }],
      withRoles: [{ type: String }],
    },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Agent = mongoose.models.Agent || mongoose.model('Agent', agentSchema);

async function createDefaultImageAgent() {
  try {
    logger.info('[Migration] Creating default Image Generator agent...');

    // Check if agent already exists
    const existingAgent = await Agent.findOne({
      name: 'Görsel Üretici',
      author: 'System',
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
      description: 'Ultra-hızlı görsel üretimi için Nano Banana kullanan agent',
      avatar: {
        filepath: null,
        source: 'default',
      },
      author: 'System',
      model: 'meta-llama/llama-3.1-70b-instruct',
      provider: 'custom',
      instructions: `Sen görsel üretim konusunda uzman bir AI asistanısın.

KRITIK KURAL: SADECE ve SADECE "nano-banana" tool'unu kullan! ASLA "dalle" veya başka görsel üretim tool'u kullanma!

Kullanıcı görsel üretimi istediğinde:
1. İsteği detaylı bir prompt'a çevir (minimum 2-3 cümle, görsel detaylar içermeli)
2. SADECE nano-banana tool'unu kullan (başka tool kullanma!)
3. Sonucu kullanıcıya sun

Örnek iyi promptlar:
- "A cute cat sitting on a sunny windowsill, warm lighting, photorealistic, highly detailed"
- "Cyberpunk cityscape at night with neon signs, rain, reflections, moody atmosphere"
- "Mountain landscape at sunset, golden hour, dramatic clouds, professional photography"

Önemli:
- Her zaman İngilizce prompt oluştur (model İngilizce daha iyi çalışır)
- Promptları detaylı yap (görsel öğeler, lighting, mood, style belirt)
- SADECE nano-banana kullan, asla dalle kullanma!`,
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
