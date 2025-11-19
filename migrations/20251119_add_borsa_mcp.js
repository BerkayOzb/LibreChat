/**
 * Migration: Add Borsa-MCP Integration
 * Date: 2025-11-19
 *
 * This migration adds Borsa-MCP (Turkish Financial Markets) server configuration
 * to librechat.yaml, enabling access to:
 * - 750+ BIST stocks with detailed profiles and financial data
 * - 800+ Turkish investment funds
 * - Cryptocurrency data (BtcTurk, Coinbase)
 * - Forex rates and commodity prices
 * - Economic indicators and technical analysis tools
 *
 * Dependencies:
 * - Node.js 16+
 * - js-yaml package
 *
 * Usage:
 *   node migrations/20251119_add_borsa_mcp.js
 *
 * Rollback:
 *   node migrations/20251119_add_borsa_mcp_rollback.js
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, '..', 'librechat.yaml');
const BACKUP_PATH = path.join(__dirname, '..', 'librechat.yaml.backup');

/**
 * Borsa-MCP server configuration
 */
const BORSA_MCP_CONFIG = {
  borsa: {
    url: 'https://borsamcp.fastmcp.app/mcp',
    transport: 'sse',
    description: 'Turkish Financial Markets - 750+ BIST stocks, 800+ funds, crypto, forex & commodities',
    enabled: true,
    timeout: 30000,
    env: {
      LOG_LEVEL: 'info',
    },
  },
};

/**
 * Main migration function
 */
async function up() {
  console.log('🚀 Starting Borsa-MCP integration migration...\n');

  try {
    // 1. Create backup
    console.log('📦 Creating backup of librechat.yaml...');
    const originalContent = await fs.readFile(CONFIG_PATH, 'utf8');
    await fs.writeFile(BACKUP_PATH, originalContent, 'utf8');
    console.log('✅ Backup created at:', BACKUP_PATH);

    // 2. Parse current config
    console.log('\n📖 Reading current configuration...');
    const config = yaml.load(originalContent);

    // 3. Check if already exists
    if (config.mcpServers?.borsa) {
      console.log('⚠️  Borsa-MCP already configured. Skipping...');
      return;
    }

    // 4. Add MCP servers section if not exists
    if (!config.mcpServers) {
      config.mcpServers = {};
      console.log('✨ Created mcpServers section');
    }

    // 5. Add Borsa-MCP configuration
    config.mcpServers = {
      ...config.mcpServers,
      ...BORSA_MCP_CONFIG,
    };

    // 6. Write updated config
    console.log('\n💾 Saving updated configuration...');
    const newConfigContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      quotingType: '"',
      forceQuotes: false,
    });
    await fs.writeFile(CONFIG_PATH, newConfigContent, 'utf8');
    console.log('✅ Configuration updated successfully');

    // 7. Display summary
    console.log('\n' + '='.repeat(80));
    console.log('✨ BORSA-MCP INTEGRATION COMPLETED SUCCESSFULLY! ✨');
    console.log('='.repeat(80));
    console.log('\n📊 What was added:');
    console.log('   • MCP Server: borsa');
    console.log('   • Endpoint: https://borsamcp.fastmcp.app/mcp');
    console.log('   • Transport: Server-Sent Events (SSE)');
    console.log('   • Tools: 50+ financial data tools');
    console.log('\n🔧 Next steps:');
    console.log('   1. Restart LibreChat server:');
    console.log('      $ npm run backend');
    console.log('');
    console.log('   2. Verify MCP connection:');
    console.log('      $ curl http://localhost:3080/api/mcp/connection/status/borsa');
    console.log('');
    console.log('   3. Test in UI:');
    console.log('      - Open LibreChat in browser');
    console.log('      - Create or edit an Agent');
    console.log('      - Check MCP tools panel for "borsa" server');
    console.log('      - Try a query: "THYAO hissesinin güncel fiyatı nedir?"');
    console.log('\n🔙 To rollback this migration:');
    console.log('   $ node migrations/20250119_add_borsa_mcp_rollback.js');
    console.log('\n📚 Documentation:');
    console.log('   - Borsa-MCP: https://github.com/saidsurucu/borsa-mcp');
    console.log('   - LibreChat MCP: https://www.librechat.ai/docs/configuration/librechat_yaml/mcp');
    console.log('');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n🔄 Attempting to restore from backup...');

    try {
      const backupContent = await fs.readFile(BACKUP_PATH, 'utf8');
      await fs.writeFile(CONFIG_PATH, backupContent, 'utf8');
      console.log('✅ Configuration restored from backup');
    } catch (restoreError) {
      console.error('❌ Failed to restore backup:', restoreError.message);
      console.error('⚠️  Please manually restore from:', BACKUP_PATH);
    }

    process.exit(1);
  }
}

/**
 * Rollback function (for convenience, main rollback is in separate file)
 */
async function down() {
  console.log('⏮️  Rolling back Borsa-MCP integration...\n');

  try {
    const configContent = await fs.readFile(CONFIG_PATH, 'utf8');
    const config = yaml.load(configContent);

    if (!config.mcpServers?.borsa) {
      console.log('⚠️  Borsa-MCP not found in configuration. Nothing to rollback.');
      return;
    }

    // Remove Borsa-MCP
    delete config.mcpServers.borsa;

    // Remove mcpServers section if empty
    if (Object.keys(config.mcpServers).length === 0) {
      delete config.mcpServers;
    }

    // Save
    const newConfigContent = yaml.dump(config, { indent: 2, lineWidth: 120 });
    await fs.writeFile(CONFIG_PATH, newConfigContent, 'utf8');

    console.log('✅ Borsa-MCP configuration removed');
    console.log('🔄 Please restart LibreChat server for changes to take effect');

  } catch (error) {
    console.error('❌ Rollback failed:', error.message);
    process.exit(1);
  }
}

// CLI execution
if (require.main === module) {
  const action = process.argv[2] || 'up';

  if (action === 'up') {
    up().catch(console.error);
  } else if (action === 'down') {
    down().catch(console.error);
  } else {
    console.error('Usage: node 20251119_add_borsa_mcp.js [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };
