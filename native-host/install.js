#!/usr/bin/env node

/**
 * Installation script for Browser MCP Native Host
 *
 * This script:
 * 1. Detects the OS (macOS, Linux, Windows)
 * 2. Creates the native messaging host manifest
 * 3. Installs it in the correct location for Chrome
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const EXTENSION_ID = 'browser-mcp-extension'; // This will be the actual extension ID

function getHostPath() {
  return path.resolve(__dirname, 'host.js');
}

function getManifestPath() {
  const platform = process.platform;
  const home = os.homedir();

  if (platform === 'darwin') {
    // macOS
    return path.join(home, 'Library/Application Support/Google/Chrome/NativeMessagingHosts');
  } else if (platform === 'linux') {
    // Linux
    return path.join(home, '.config/google-chrome/NativeMessagingHosts');
  } else if (platform === 'win32') {
    // Windows - uses registry, but we'll put the manifest in a standard location
    return path.join(home, 'AppData/Local/Google/Chrome/User Data/NativeMessagingHosts');
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }
}

function createManifest(hostPath, extensionId) {
  return {
    name: 'com.browser_mcp.native_host',
    description: 'Native messaging host for Browser MCP',
    path: hostPath,
    type: 'stdio',
    allowed_origins: [
      `chrome-extension://${extensionId}/`
    ]
  };
}

function install() {
  console.log('🚀 Installing Browser MCP Native Messaging Host...\n');

  // Get paths
  const hostPath = getHostPath();
  const manifestDir = getManifestPath();
  const manifestPath = path.join(manifestDir, 'com.browser_mcp.native_host.json');

  console.log(`📁 Host script: ${hostPath}`);
  console.log(`📁 Manifest directory: ${manifestDir}`);
  console.log(`📁 Manifest file: ${manifestPath}\n`);

  // Ensure host script exists and is executable
  if (!fs.existsSync(hostPath)) {
    console.error(`❌ Error: host.js not found at ${hostPath}`);
    process.exit(1);
  }

  try {
    fs.chmodSync(hostPath, '755');
  } catch (err) {
    console.warn(`⚠️  Warning: Could not make host.js executable: ${err.message}`);
  }

  // Create manifest directory if it doesn't exist
  if (!fs.existsSync(manifestDir)) {
    console.log(`📂 Creating directory: ${manifestDir}`);
    fs.mkdirSync(manifestDir, { recursive: true });
  }

  // Get extension ID (will be provided during actual installation)
  console.log('\n⚠️  IMPORTANT: Extension ID needed!');
  console.log('After loading the extension in Chrome:');
  console.log('1. Go to chrome://extensions/');
  console.log('2. Find "Browser Inspector for AI"');
  console.log('3. Copy the Extension ID (long string like "abcdefghijklmnop...")');
  console.log('4. Run: npm run install-host -- <EXTENSION_ID>\n');

  const extensionId = process.argv[2] || EXTENSION_ID;

  // Create manifest
  const manifest = createManifest(hostPath, extensionId);

  // Write manifest
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');

  console.log('✅ Native messaging host installed successfully!\n');
  console.log('📝 Manifest contents:');
  console.log(JSON.stringify(manifest, null, 2));
  console.log('\n🎉 Installation complete!');
  console.log('\nNext steps:');
  console.log('1. Load the Chrome extension (if not already loaded)');
  console.log('2. If you haven\'t set the extension ID yet:');
  console.log('   - Get it from chrome://extensions/');
  console.log('   - Run: npm run install-host -- <YOUR_EXTENSION_ID>');
  console.log('3. Test the setup wizard - it should now write configs automatically!\n');
}

// Handle errors
process.on('uncaughtException', (err) => {
  console.error(`\n❌ Error: ${err.message}`);
  process.exit(1);
});

// Run installation
install();
