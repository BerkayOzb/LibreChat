/**
 * Rollback Migration: Remove Borsa-MCP Integration
 * Date: 2025-01-19
 *
 * This script removes the Borsa-MCP server configuration from librechat.yaml
 * and restores the configuration to its previous state.
 *
 * Usage:
 *   node migrations/20250119_add_borsa_mcp_rollback.js
 *
 * What this does:
 * - Removes 'borsa' entry from mcpServers section
 * - Removes mcpServers section entirely if it becomes empty
 * - Creates a backup before making changes
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, '..', 'librechat.yaml');
const ROLLBACK_BACKUP_PATH = path.join(__dirname, '..', 'librechat.yaml.rollback_backup');

async function rollback() {
  console.log('🔄 Starting Borsa-MCP rollback...\n');

  try {
    // 1. Create backup before rollback
    console.log('📦 Creating rollback backup...');
    const originalContent = await fs.readFile(CONFIG_PATH, 'utf8');
    await fs.writeFile(ROLLBACK_BACKUP_PATH, originalContent, 'utf8');
    console.log('✅ Rollback backup created at:', ROLLBACK_BACKUP_PATH);

    // 2. Parse current config
    console.log('\n📖 Reading current configuration...');
    const config = yaml.load(originalContent);

    // 3. Check if Borsa-MCP exists
    if (!config.mcpServers?.borsa) {
      console.log('\n⚠️  Borsa-MCP not found in configuration.');
      console.log('    Nothing to rollback. Configuration is already clean.');
      return;
    }

    console.log('✅ Found Borsa-MCP configuration');

    // 4. Remove Borsa-MCP
    console.log('\n🗑️  Removing Borsa-MCP configuration...');
    delete config.mcpServers.borsa;

    // 5. Clean up empty mcpServers section
    if (Object.keys(config.mcpServers).length === 0) {
      console.log('📝 Removing empty mcpServers section...');
      delete config.mcpServers;
    }

    // 6. Save updated config
    console.log('\n💾 Saving configuration...');
    const newConfigContent = yaml.dump(config, {
      indent: 2,
      lineWidth: 120,
      quotingType: '"',
      forceQuotes: false,
    });
    await fs.writeFile(CONFIG_PATH, newConfigContent, 'utf8');

    // 7. Display success message
    console.log('\n' + '='.repeat(80));
    console.log('✅ BORSA-MCP ROLLBACK COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log('\n📊 What was removed:');
    console.log('   • MCP Server: borsa');
    console.log('   • All Borsa-MCP related tools');
    console.log('\n🔧 Next steps:');
    console.log('   1. Restart LibreChat server:');
    console.log('      $ npm run backend');
    console.log('');
    console.log('   2. Verify removal:');
    console.log('      - Open LibreChat in browser');
    console.log('      - Check MCP panel - "borsa" should be gone');
    console.log('');
    console.log('💡 To re-apply Borsa-MCP integration:');
    console.log('   $ node migrations/20250119_add_borsa_mcp.js up');
    console.log('\n📦 Rollback backup saved at:');
    console.log('   ' + ROLLBACK_BACKUP_PATH);
    console.log('');

  } catch (error) {
    console.error('\n❌ Rollback failed:', error.message);
    console.error('\n🔄 Attempting to restore from rollback backup...');

    try {
      const backupContent = await fs.readFile(ROLLBACK_BACKUP_PATH, 'utf8');
      await fs.writeFile(CONFIG_PATH, backupContent, 'utf8');
      console.log('✅ Configuration restored from rollback backup');
    } catch (restoreError) {
      console.error('❌ Failed to restore backup:', restoreError.message);
      console.error('⚠️  Please manually restore from:', ROLLBACK_BACKUP_PATH);
    }

    process.exit(1);
  }
}

// Execute rollback
if (require.main === module) {
  rollback().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { rollback };
