#!/usr/bin/env node

/**
 * Browser MCP Native Host CLI
 * Configure and manage the native messaging host
 */

const ManifestConfig = require('./lib/manifest-config');
const readline = require('readline');

const GREEN = '\x1b[32m';
const BLUE = '\x1b[34m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';
const NC = '\x1b[0m'; // No Color

function log(message, color = NC) {
  console.log(`${color}${message}${NC}`);
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function showHelp() {
  console.log(`
Browser MCP Setup - Configuration Tool

Usage:
  browser-mcp-setup              Interactive setup
  browser-mcp-setup [extensionId] Setup with specific extension ID
  browser-mcp-setup --help       Show this help
  browser-mcp-setup --version    Show version
  browser-mcp-setup --status     Show current configuration

Examples:
  browser-mcp-setup
  browser-mcp-setup abcdefghijklmnopqrstuvwxyz123456
`);
}

function showVersion() {
  const pkg = require('./package.json');
  console.log(`Browser MCP Native Host v${pkg.version}`);
}

async function showStatus() {
  const config = new ManifestConfig();

  log('\n📊 Current Configuration:', BLUE);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', BLUE);

  const manifest = config.readManifest();

  if (!manifest) {
    log('❌ Not configured', RED);
    log('   Run "browser-mcp-setup" to configure', YELLOW);
    return;
  }

  const extensionId = config.getExtensionId();
  log(`✅ Configured`, GREEN);
  log(`   Extension ID: ${extensionId}`, NC);
  log(`   Manifest: ${config.getManifestDir()}/com.browsermcp.native.json`, NC);
  log(`   Host: ${manifest.path}`, NC);
  log('');
}

async function setup(providedExtensionId) {
  log('\n╔════════════════════════════════════════════════════════════╗', BLUE);
  log('║                                                            ║', BLUE);
  log('║        Browser MCP Native Host - Configuration            ║', BLUE);
  log('║                                                            ║', BLUE);
  log('╚════════════════════════════════════════════════════════════╝', BLUE);
  log('');

  const config = new ManifestConfig();

  try {
    let extensionId = providedExtensionId;

    // If not provided, try auto-detect
    if (!extensionId) {
      log('🔍 Auto-detecting Browser MCP extension...', BLUE);
      const detectedId = config.autoDetectExtensionId();

      if (detectedId) {
        log(`✅ Found Browser MCP extension: ${detectedId}`, GREEN);
        log('');

        const response = await promptUser(`Use this extension ID? (y/n): `);

        if (response.toLowerCase() === 'y' || response.toLowerCase() === 'yes') {
          extensionId = detectedId;
        }
      }
    }

    // If still not set, prompt for manual entry
    if (!extensionId) {
      log('');
      log('Please load the Browser MCP extension in Chrome first:', YELLOW);
      log('  1. Open chrome://extensions/', YELLOW);
      log('  2. Enable "Developer mode"', YELLOW);
      log('  3. Load the browser-mcp-extension folder', YELLOW);
      log('  4. Copy the extension ID', YELLOW);
      log('');

      extensionId = await promptUser('Enter Chrome extension ID: ');
    }

    // Validate extension ID
    if (!extensionId || extensionId.length !== 32) {
      log('❌ Invalid extension ID. Must be 32 characters.', RED);
      process.exit(1);
    }

    // Create manifest
    log('');
    log('📝 Creating native messaging manifest...', BLUE);
    const manifestPath = config.createManifest(extensionId);

    log(`✅ Manifest created: ${manifestPath}`, GREEN);
    log('');
    log('╔════════════════════════════════════════════════════════════╗', GREEN);
    log('║                                                            ║', GREEN);
    log('║                  ✅ Setup Complete!                        ║', GREEN);
    log('║                                                            ║', GREEN);
    log('╚════════════════════════════════════════════════════════════╝', GREEN);
    log('');
    log('Next steps:', BLUE);
    log('  1. Configure your IDE (Claude/Cursor/Windsurf):', BLUE);
    log('     Add to config: "command": "browser-mcp-host"', BLUE);
    log('  2. Restart your IDE', BLUE);
    log('  3. Test the connection', BLUE);
    log('');

  } catch (error) {
    log(`❌ Error: ${error.message}`, RED);
    process.exit(1);
  }
}

// Main CLI
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    await setup();
  } else if (args[0] === '--help' || args[0] === '-h') {
    showHelp();
  } else if (args[0] === '--version' || args[0] === '-v') {
    showVersion();
  } else if (args[0] === '--status' || args[0] === '-s') {
    await showStatus();
  } else if (args[0].length === 32) {
    // Assume it's an extension ID
    await setup(args[0]);
  } else {
    log('❌ Unknown option or invalid extension ID', RED);
    showHelp();
    process.exit(1);
  }
}

main().catch(console.error);
