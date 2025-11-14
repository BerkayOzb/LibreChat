const { SystemRoles, AccessRoleIds, PrincipalType, ResourceType } = require('librechat-data-provider');
const { getProjectByName, addAgentIdsToProject } = require('~/models/Project');
const crypto = require('crypto');

/**
 * Seeds the default "Görsel Üretici" (Image Generator) agent
 * This agent is available to all users via the global project and ACL permissions
 */
async function seedDefaultImageAgent() {
  try {
    const { Agent, User } = require('~/db/models');
    const logger = require('~/config/winston');

    logger.info('[Seed] Checking for default Image Generator agent...');

    // Find or create system user
    let systemUser = await User.findOne({ email: 'system@librechat.local' });

    if (!systemUser) {
      logger.info('[Seed] Creating system user for default agents...');
      systemUser = await User.create({
        provider: 'local',
        email: 'system@librechat.local',
        emailVerified: true,
        username: 'system',
        name: 'System',
        role: SystemRoles.ADMIN,
        password: crypto.randomBytes(32).toString('hex'), // Random password, never used
      });
      logger.info('[Seed] System user created');
    }

    // Check if agent already exists
    const existingAgent = await Agent.findOne({
      name: 'Görsel Üretici',
      author: systemUser._id,
    });

    if (existingAgent) {
      logger.info('[Seed] Default Image Generator agent already exists');
      return existingAgent;
    }

    // Generate unique agent ID
    const agentId = 'agent_' + crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '').substring(0, 21);

    logger.info('[Seed] Creating default Image Generator agent...');

    // Create the agent
    const imageAgent = await Agent.create({
      id: agentId,
      name: 'Görsel Üretici',
      description: 'Ultra-hızlı görsel üretimi için Nano Banana kullanan sistem agent\'ı',
      avatar: {
        filepath: null,
        source: 'default',
      },
      author: systemUser._id,
      model: 'gpt-4o-mini',
      provider: 'openAI',
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
      isCollaborative: true,
    });

    logger.info(`[Seed] Agent created with ID: ${imageAgent.id}`);

    // Add to global project
    const globalProject = await getProjectByName('instance');
    if (globalProject) {
      await addAgentIdsToProject(globalProject._id, [imageAgent.id]);
      logger.info('[Seed] Agent added to global project');
    } else {
      logger.warn('[Seed] Global project not found - agent may not be visible to all users');
    }

    // Grant public editor permission (all users can view, use and edit)
    try {
      const { AclEntry, AccessRole } = require('~/db/models');

      // Find the agent_editor role (permBits: 3 = VIEW + EDIT)
      const editorRole = await AccessRole.findOne({ accessRoleId: AccessRoleIds.AGENT_EDITOR });
      if (!editorRole) {
        throw new Error('Agent editor role not found');
      }

      // Create ACL entry for public access
      await AclEntry.create({
        principalType: PrincipalType.PUBLIC,
        principalId: null,
        resourceType: ResourceType.AGENT,
        resourceId: imageAgent._id,
        accessRoleId: editorRole._id,
        permBits: editorRole.permBits,
        grantedBy: systemUser._id,
      });

      logger.info('[Seed] Public permissions granted - agent available to all users');
    } catch (permError) {
      logger.error('[Seed] Failed to grant permissions:', permError.message);
      logger.warn('[Seed] Agent created but permissions may need to be set manually');
    }

    logger.info('[Seed] Default Image Generator agent setup complete!');
    return imageAgent;

  } catch (error) {
    const logger = require('~/config/winston');
    logger.error('[Seed] Error seeding default Image Generator agent:', error);
    // Don't throw - seeding should not block server startup
    return null;
  }
}

module.exports = seedDefaultImageAgent;
