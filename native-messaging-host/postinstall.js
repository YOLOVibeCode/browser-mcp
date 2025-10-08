#!/usr/bin/env node

/**
 * Post-install script for @browser-mcp/native-host
 * Automatically sets up native messaging manifest
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

async function main() {
  log('\n╔════════════════════════════════════════════════════════════╗', BLUE);
  log('║                                                            ║', BLUE);
  log('║     Browser MCP Native Host - Post Install Setup          ║', BLUE);
  log('║                                                            ║', BLUE);
  log('╚════════════════════════════════════════════════════════════╝', BLUE);
  log('');

  const config = new ManifestConfig();

  try {
    // Check if manifest already exists
    const existingId = config.getExtensionId();

    if (existingId) {
      log(`✅ Native messaging manifest already configured`, GREEN);
      log(`   Extension ID: ${existingId}`, GREEN);
      log('');
      log('To reconfigure, run: browser-mcp-setup', YELLOW);
      return;
    }

    // Try to auto-detect extension ID
    log('🔍 Auto-detecting Browser MCP extension...', BLUE);
    const detectedId = config.autoDetectExtensionId();

    let extensionId;

    if (detectedId) {
      log(`✅ Found Browser MCP extension: ${detectedId}`, GREEN);
      log('');

      const response = await promptUser(`Use this extension ID? (y/n): `);

      if (response.toLowerCase() === 'y' || response.toLowerCase() === 'yes') {
        extensionId = detectedId;
      }
    }

    // If not auto-detected or user declined, prompt for manual entry
    if (!extensionId) {
      log('');
      log('Please load the Browser MCP extension in Chrome first:', YELLOW);
      log('  1. Open chrome://extensions/', YELLOW);
      log('  2. Enable "Developer mode"', YELLOW);
      log('  3. Load the browser-mcp-extension folder', YELLOW);
      log('  4. Copy the extension ID', YELLOW);
      log('');

      extensionId = await promptUser('Enter Chrome extension ID: ');

      if (!extensionId || extensionId.length !== 32) {
        log('❌ Invalid extension ID. Must be 32 characters.', RED);
        log('   Run "browser-mcp-setup" after loading the extension.', YELLOW);
        return;
      }
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
    log('  1. Configure your IDE (Claude/Cursor/Windsurf)', BLUE);
    log('  2. Add to config: "command": "browser-mcp-host"', BLUE);
    log('  3. Restart your IDE', BLUE);
    log('');
    log('To reconfigure: browser-mcp-setup', YELLOW);
    log('');

  } catch (error) {
    log(`❌ Error: ${error.message}`, RED);
    log('');
    log('To configure manually, run: browser-mcp-setup', YELLOW);
    process.exit(0); // Don't fail npm install
  }
}

// Only run if not in CI environment
if (!process.env.CI && !process.env.SKIP_POSTINSTALL) {
  main().catch(console.error);
}
