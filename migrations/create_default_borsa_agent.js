/**
 * Migration: Create Default Borsa Assistant Agent
 * Date: 2025-11-19
 *
 * Otomatik olarak "Borsa Asistanı" agent'ını oluşturur
 * Tüm kullanıcılara açık, borsa-mcp tool'larıyla donatılmış
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

async function createDefaultBorsaAgent() {
    try {
        logger.info('[Migration] Creating default Borsa Assistant agent...');

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
            name: 'Borsa Asistanı',
            author: systemUser._id,
        });

        if (existingAgent) {
            logger.info('[Migration] Borsa Assistant agent already exists, skipping...');
            return existingAgent;
        }

        // Generate unique agent ID
        const crypto = require('crypto');
        const agentId = 'agent_' + crypto.randomBytes(12).toString('base64').replace(/[+/=]/g, '').substring(0, 21);

        // All borsa-mcp tools (50 tools)
        const borsaMcpTools = [
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
        ];

        // Create the agent
        const borsaAgent = await Agent.create({
            id: agentId,
            name: 'Borsa Asistanı',
            description: 'Türkiye finansal piyasaları için 750+ hisse, 800+ fon, kripto ve döviz verileri sunan uzman asistan',
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
            tools: borsaMcpTools,
            capabilities: ['tools'],
            // Set MCP servers - borsa-mcp will be selected in UI
            mcp: ['borsa-mcp'],
            temperature: 0.3, // Lower temperature for financial accuracy
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

        logger.info('[Migration] Default Borsa Assistant agent created successfully!');
        logger.info(`[Migration] Agent ID: ${borsaAgent._id}`);

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
            resourceId: borsaAgent._id,
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
            resourceId: borsaAgent._id,
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

        return borsaAgent;
    } catch (error) {
        logger.error('[Migration] Error creating default Borsa Assistant agent:', error);
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
            await createDefaultBorsaAgent();
            logger.info('[Migration] Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            logger.error('[Migration] MongoDB connection error:', error);
            process.exit(1);
        });
}

module.exports = { createDefaultBorsaAgent };
