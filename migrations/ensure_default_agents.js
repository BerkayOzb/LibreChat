/**
 * Migration: Ensure Default Agents (Görsel Üretici & Borsa Asistanı)
 *
 * Bu script:
 * 1. "Görsel Üretici" ve "Borsa Asistanı" agent'larının varlığını garanti eder.
 * 2. Eğer agent zaten varsa ve konfigürasyonu aynıysa HİÇBİR ŞEY YAPMAZ (Idempotent).
 * 3. Eğer agent yoksa veya değişmişse günceller.
 * 4. İzinleri (ACL) kontrol eder, eksikse onarır.
 */

const mongoose = require('mongoose');
const path = require('path');
const _ = require('lodash'); // Lodash for deep comparison if available, or use JSON.stringify

// Logger fallback
const logger = {
    info: (...args) => console.log('[INFO]', ...args),
    error: (...args) => console.error('[ERROR]', ...args),
    warn: (...args) => console.warn('[WARN]', ...args),
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

// Helper for deep equality
function isConfigurationSame(existing, desired) {
    if (!existing) return false;

    // Fields to compare
    const fields = [
        'name',
        'description',
        'instructions',
        'model',
        'provider',
        'tools',
    ];

    for (const field of fields) {
        const val1 = existing[field];
        const val2 = desired[field];

        // Simple JSON stringify comparison for arrays/objects
        // Use JSON.stringify to compare values, handling Mongoose objects by converting to plain objects if possible
        const str1 = JSON.stringify(val1);
        const str2 = JSON.stringify(val2);

        if (str1 !== str2) {
            // logger.info(`[Migration] Diff in ${field}:`, { existing: str1, desired: str2 });
            return false;
        }
    }
    return true;
}

async function ensureDefaultAgents() {
    try {
        logger.info('[Migration] Starting Default Agents Check & Repair...');

        // Initialize models
        await initModels();

        // 1. Find or create system user
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

        // 2. Define Agents
        const agentsToEnsure = [
            {
                name: 'Görsel Üretici',
                config: {
                    name: 'Görsel Üretici',
                    description: 'Ultra-hızlı görsel üretimi için Nano Banana kullanan agent',
                    avatar: {
                        filepath: null,
                        source: 'default',
                    },
                    author: systemUser._id,
                    model: 'openai/gpt-4o-mini',
                    provider: 'AI Models',
                    instructions: `Sen görsel üretim konusunda uzman bir AI asistanısın.

KRITIK KURALLAR:
1. SADECE "nano-banana" tool'unu kullan! ASLA "dalle" veya başka tool kullanma!
2. Görsel ürettikten sonra görseli ASLA analiz etme veya açıklama!
3. Sadece görselin hazır olduğunu söyle ve URL'i göster.

Kullanıcı görsel üretimi istediğinde:
1. İsteği detaylı İngilizce prompt'a çevir (minimum 2-3 cümle, görsel detaylar)
2. nano-banana tool'unu çağır
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
                    permissions: {
                        share: {
                            isShared: true,
                            isPublic: true,
                            withUsers: [],
                            withGroups: [],
                            withRoles: [],
                        },
                    },
                },
            },
            {
                name: 'Borsa Asistanı',
                config: {
                    name: 'Borsa Asistanı',
                    description:
                        'Türkiye finansal piyasaları için 750+ hisse, 800+ fon, kripto ve döviz verileri sunan uzman asistan',
                    avatar: {
                        filepath: null,
                        source: 'default',
                    },
                    author: systemUser._id,
                    model: 'gpt-4o-mini',
                    provider: 'openAI',
                    instructions: `Sen Türkiye finansal piyasaları konusunda uzman bir AI asistanısın. Borsa İstanbul, yatırım fonları, kripto paralar ve döviz piyasaları hakkında güncel ve detaylı bilgi sağlıyorsun.

**Uzmanlık Alanların:**
- 📈 BIST hisse senetleri (750+ şirket)
- 💰 Yatırım fonları (800+ fon)
- ₿ Kripto paralar (BtcTurk, Coinbase)
- 💱 Döviz kurları ve emtialar
- 📊 Teknik analiz ve finansal metrikler
- 📰 KAP haberleri ve şirket duyuruları
- 🎯 Değerleme analizleri

**Nasıl Kullanmalısın:**
1. Kullanıcılar hisse senedi, fon, kripto veya döviz sorduğunda ilgili tool'u kullan
2. Finansal verileri açık ve anlaşılır şekilde sun
3. Teknik terimleri gerektiğinde açıkla
4. Güncel piyasa verileriyle cevap ver

**Önemli Kurallar:**
- Her zaman güncel verileri kullan
- Yatırım tavsiyesi VERME, sadece bilgi sun
- Verilerin tarihi ve kaynağını belirt
- Kullanıcının seviyesine uygun dil kullan

**Veri Türleri:**
- Hisse senetleri: Fiyat, hacim, teknik göstergeler, mali tablolar
- Fonlar: Performans, portföy dağılımı, karşılaştırma
- Kripto: Fiyat, hacim, order book, teknik analiz
- Döviz: Alış-satış, güncel kurlar, tarihsel veriler

Kullanıcılara yardımcı ol, finansal okuryazarlıklarını artır!`,
                    tools: [
                        // Hisse Senedi Araçları
                        'find_ticker_code_mcp_borsa-mcp',
                        'get_sirket_profili_mcp_borsa-mcp',
                        'get_bilanco_mcp_borsa-mcp',
                        'get_kar_zarar_tablosu_mcp_borsa-mcp',
                        'get_nakit_akisi_tablosu_mcp_borsa-mcp',
                        'get_finansal_veri_mcp_borsa-mcp',
                        'get_analist_tahminleri_mcp_borsa-mcp',
                        'get_temettu_ve_aksiyonlar_mcp_borsa-mcp',
                        'get_hizli_bilgi_mcp_borsa-mcp',
                        'get_kazanc_takvimi_mcp_borsa-mcp',
                        'get_teknik_analiz_mcp_borsa-mcp',
                        'get_pivot_points_mcp_borsa-mcp',
                        'get_sektor_karsilastirmasi_mcp_borsa-mcp',
                        'get_kap_haberleri_mcp_borsa-mcp',
                        'get_kap_haber_detayi_mcp_borsa-mcp',
                        'get_katilim_finans_uygunluk_mcp_borsa-mcp',
                        // Endeks Araçları
                        'get_endeks_kodu_mcp_borsa-mcp',
                        'get_endeks_sirketleri_mcp_borsa-mcp',
                        // Fon Araçları
                        'search_funds_mcp_borsa-mcp',
                        'get_fund_detail_mcp_borsa-mcp',
                        'get_fund_performance_mcp_borsa-mcp',
                        'get_fund_portfolio_mcp_borsa-mcp',
                        'compare_funds_mcp_borsa-mcp',
                        'get_fon_mevzuati_mcp_borsa-mcp',
                        // Kripto Araçları (BtcTurk)
                        'get_kripto_exchange_info_mcp_borsa-mcp',
                        'get_kripto_ticker_mcp_borsa-mcp',
                        'get_kripto_orderbook_mcp_borsa-mcp',
                        'get_kripto_trades_mcp_borsa-mcp',
                        'get_kripto_ohlc_mcp_borsa-mcp',
                        'get_kripto_kline_mcp_borsa-mcp',
                        'get_kripto_teknik_analiz_mcp_borsa-mcp',
                        // Kripto Araçları (Coinbase)
                        'get_coinbase_exchange_info_mcp_borsa-mcp',
                        'get_coinbase_ticker_mcp_borsa-mcp',
                        'get_coinbase_orderbook_mcp_borsa-mcp',
                        'get_coinbase_trades_mcp_borsa-mcp',
                        'get_coinbase_ohlc_mcp_borsa-mcp',
                        'get_coinbase_server_time_mcp_borsa-mcp',
                        'get_coinbase_teknik_analiz_mcp_borsa-mcp',
                        // Döviz ve Emtia
                        'get_dovizcom_guncel_mcp_borsa-mcp',
                        'get_dovizcom_dakikalik_mcp_borsa-mcp',
                        'get_dovizcom_arsiv_mcp_borsa-mcp',
                        // Ekonomik Göstergeler
                        'get_economic_calendar_mcp_borsa-mcp',
                        'get_turkiye_enflasyon_mcp_borsa-mcp',
                        'get_enflasyon_hesapla_mcp_borsa-mcp',
                        'get_tahvil_faizleri_mcp_borsa-mcp',
                        // Analiz Araçları
                        'calculate_buffett_value_analysis_mcp_borsa-mcp',
                        'calculate_comprehensive_analysis_mcp_borsa-mcp',
                        'calculate_core_financial_health_mcp_borsa-mcp',
                        'calculate_advanced_metrics_mcp_borsa-mcp',
                        // Sistem
                        'get_system_prompt_mcp_borsa-mcp',
                    ],
                    capabilities: ['tools'],
                    mcp: ['borsa-mcp'],
                    temperature: 0.3,
                    top_p: 1,
                    presence_penalty: 0,
                    frequency_penalty: 0,
                    permissions: {
                        share: {
                            isShared: true,
                            isPublic: true,
                            withUsers: [],
                            withGroups: [],
                            withRoles: [],
                        },
                    },
                },
            },
        ];

        // 3. Process Agents
        for (const agentDef of agentsToEnsure) {
            logger.info(`[Migration] Processing agent: ${agentDef.name}`);

            // A. Check if Agent Exists and is Same
            let agent = await Agent.findOne({
                name: agentDef.name,
                author: systemUser._id,
            });

            let agentUpdated = false;

            if (!agent) {
                // Create new
                const crypto = require('crypto');
                const agentId =
                    'agent_' +
                    crypto
                        .randomBytes(12)
                        .toString('base64')
                        .replace(/[+/=]/g, '')
                        .substring(0, 21);

                agent = await Agent.create({
                    ...agentDef.config,
                    id: agentId,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                logger.info(`[Migration] Created new agent: ${agent.name} (${agent._id})`);
                agentUpdated = true;
            } else {
                // Check if update needed
                if (!isConfigurationSame(agent, agentDef.config)) {
                    Object.assign(agent, agentDef.config);
                    agent.updatedAt = new Date();
                    await agent.save();
                    logger.info(`[Migration] Updated existing agent: ${agent.name} (${agent._id})`);
                    agentUpdated = true;
                } else {
                    // logger.info(`[Migration] Agent ${agent.name} is up to date. Skipping update.`);
                }
            }

            // B. Check Permissions (ACL)
            // We only check/repair permissions if:
            // 1. Agent was updated/created (agentUpdated === true)
            // 2. OR permissions are missing
            const ownerPermission = await AclEntry.findOne({
                resourceId: agent._id,
                resourceType: 'agent',
                principalId: systemUser._id,
                permBits: 15,
            });

            const publicPermission = await AclEntry.findOne({
                resourceId: agent._id,
                resourceType: 'agent',
                principalType: 'public',
                permBits: 1,
            });

            if (agentUpdated || !ownerPermission || !publicPermission) {
                logger.info(`[Migration] Verifying/Repairing permissions for: ${agent.name}`);

                // Find roles
                const viewerRole = await AccessRole.findOne({
                    resourceType: 'agent',
                    accessRoleId: 'agent_viewer',
                });
                const ownerRole = await AccessRole.findOne({
                    resourceType: 'agent',
                    accessRoleId: 'agent_owner',
                });

                if (!viewerRole || !ownerRole) {
                    logger.error('[Migration] Required AccessRoles not found (agent_viewer or agent_owner). Skipping permission repair for this agent.');
                    continue;
                }

                // Clear existing permissions for this agent to ensure clean state
                await AclEntry.deleteMany({
                    resourceId: agent._id,
                    resourceType: 'agent',
                });

                // Grant OWNER permission to system user
                await AclEntry.create({
                    resourceId: agent._id,
                    principalType: 'user',
                    principalId: systemUser._id,
                    principalModel: 'User',
                    resourceType: 'agent',
                    permBits: 15, // Full permissions
                    roleId: ownerRole._id,
                    grantedBy: systemUser._id,
                    grantedAt: new Date(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    __v: 0,
                });

                // Grant PUBLIC VIEW permission
                await AclEntry.create({
                    resourceId: agent._id,
                    principalType: 'public',
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

                logger.info(`[Migration] Permissions repaired for: ${agent.name}`);
            } else {
                // logger.info(`[Migration] Permissions for ${agent.name} are up to date. Skipping repair.`);
            }
        }
        logger.info('[Migration] Default Agents Check & Repair Completed Successfully!');
    } catch (error) {
        logger.error('[Migration] Error ensuring default agents:', error);
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
            await ensureDefaultAgents();
            logger.info('[Migration] Script finished');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('[Migration] MongoDB connection error:', error);
            process.exit(1);
        });
}

module.exports = { ensureDefaultAgents };
