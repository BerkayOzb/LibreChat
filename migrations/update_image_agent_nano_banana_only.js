/**
 * Migration: Force Görsel Üretici Agent to ONLY use nano-banana
 *
 * Bu migration database'deki "Görsel Üretici" agent'ını günceller
 * ve sadece nano-banana kullanmasını garantiler
 */

const mongoose = require('mongoose');

// Logger fallback
const logger = {
  info: (...args) => console.log('[INFO]', ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  warn: (...args) => console.warn('[WARN]', ...args),
};

async function updateImageAgent() {
  try {
    logger.info('[Migration] Updating Görsel Üretici agent to ONLY use nano-banana...');

    // Find the agent
    const Agent = mongoose.connection.collection('agents');

    const existingAgent = await Agent.findOne({
      name: 'Görsel Üretici',
      author: 'System',
    });

    if (!existingAgent) {
      logger.warn('[Migration] Görsel Üretici agent not found in database!');
      return null;
    }

    logger.info('[Migration] Found agent:', existingAgent._id);
    logger.info('[Migration] Current tools:', existingAgent.tools);
    logger.info('[Migration] Current model:', existingAgent.model);
    logger.info('[Migration] Current provider:', existingAgent.provider);

    // Update the agent with correct configuration
    const updateResult = await Agent.updateOne(
      {
        name: 'Görsel Üretici',
        author: 'System',
      },
      {
        $set: {
          description: 'Ultra-hızlı görsel üretimi için Nano Banana kullanan agent',
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
          updatedAt: new Date(),
        },
      }
    );

    logger.info('[Migration] Update result:', updateResult);

    if (updateResult.modifiedCount > 0) {
      logger.info('[Migration] ✅ Agent successfully updated to use ONLY nano-banana!');

      // Verify the update
      const updatedAgent = await Agent.findOne({
        name: 'Görsel Üretici',
        author: 'System',
      });

      logger.info('[Migration] Verified - Updated tools:', updatedAgent.tools);
      logger.info('[Migration] Verified - Updated model:', updatedAgent.model);
      logger.info('[Migration] Verified - Updated provider:', updatedAgent.provider);
    } else {
      logger.warn('[Migration] ⚠️  No changes made (agent might already be up to date)');
    }

    return updateResult;
  } catch (error) {
    logger.error('[Migration] ❌ Error updating agent:', error);
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
      await updateImageAgent();
      logger.info('[Migration] Migration completed successfully');
      await mongoose.connection.close();
      process.exit(0);
    })
    .catch((error) => {
      logger.error('[Migration] MongoDB connection error:', error);
      process.exit(1);
    });
}

module.exports = { updateImageAgent };
