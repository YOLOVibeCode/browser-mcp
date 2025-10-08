#!/usr/bin/env node

/**
 * Native Messaging Manifest Configuration
 * Handles manifest creation for different platforms
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

class ManifestConfig {
  constructor() {
    this.platform = os.platform();
    this.homeDir = os.homedir();
  }

  /**
   * Get manifest directory for current platform
   */
  getManifestDir() {
    switch (this.platform) {
      case 'darwin':
        return path.join(this.homeDir, 'Library/Application Support/Google/Chrome/NativeMessagingHosts');

      case 'linux':
        return path.join(this.homeDir, '.config/google-chrome/NativeMessagingHosts');

      case 'win32':
        // Windows uses registry, but we'll create file for reference
        return path.join(process.env.APPDATA, 'Google', 'Chrome', 'NativeMessagingHosts');

      default:
        throw new Error(`Unsupported platform: ${this.platform}`);
    }
  }

  /**
   * Get host script path
   */
  getHostPath() {
    // npm global bin location
    const npmBin = process.env.npm_config_prefix || '/usr/local';

    switch (this.platform) {
      case 'win32':
        return path.join(npmBin, 'node_modules', '@browser-mcp', 'native-host', 'host.js');
      default:
        return path.join(npmBin, 'lib', 'node_modules', '@browser-mcp', 'native-host', 'host.js');
    }
  }

  /**
   * Create manifest file
   */
  createManifest(extensionId) {
    if (!extensionId || extensionId === 'YOUR_EXTENSION_ID_HERE') {
      throw new Error('Valid extension ID required');
    }

    const manifestDir = this.getManifestDir();
    const manifestPath = path.join(manifestDir, 'com.browsermcp.native.json');

    // Create directory if it doesn't exist
    if (!fs.existsSync(manifestDir)) {
      fs.mkdirSync(manifestDir, { recursive: true });
    }

    const manifest = {
      name: 'com.browsermcp.native',
      description: 'Browser MCP Native Messaging Host',
      path: this.getHostPath(),
      type: 'stdio',
      allowed_origins: [
        `chrome-extension://${extensionId}/`
      ]
    };

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

    return manifestPath;
  }

  /**
   * Read existing manifest
   */
  readManifest() {
    const manifestDir = this.getManifestDir();
    const manifestPath = path.join(manifestDir, 'com.browsermcp.native.json');

    if (!fs.existsSync(manifestPath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(manifestPath, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Get extension ID from manifest
   */
  getExtensionId() {
    const manifest = this.readManifest();
    if (!manifest || !manifest.allowed_origins || manifest.allowed_origins.length === 0) {
      return null;
    }

    const origin = manifest.allowed_origins[0];
    const match = origin.match(/chrome-extension:\/\/([^\/]+)\//);
    return match ? match[1] : null;
  }

  /**
   * Auto-detect extension ID from Chrome
   */
  autoDetectExtensionId() {
    // Try to find Browser MCP extension in Chrome
    let extensionsDir;

    switch (this.platform) {
      case 'darwin':
        extensionsDir = path.join(this.homeDir, 'Library/Application Support/Google/Chrome/Default/Extensions');
        break;
      case 'linux':
        extensionsDir = path.join(this.homeDir, '.config/google-chrome/Default/Extensions');
        break;
      case 'win32':
        extensionsDir = path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'User Data', 'Default', 'Extensions');
        break;
      default:
        return null;
    }

    if (!fs.existsSync(extensionsDir)) {
      return null;
    }

    try {
      const extensions = fs.readdirSync(extensionsDir);

      // Look for Browser MCP extension by checking manifest.json
      for (const extId of extensions) {
        const extPath = path.join(extensionsDir, extId);
        const versions = fs.readdirSync(extPath);

        if (versions.length === 0) continue;

        const manifestPath = path.join(extPath, versions[0], 'manifest.json');

        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

          // Check if it's Browser MCP
          if (manifest.name && manifest.name.includes('Browser MCP')) {
            return extId;
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return null;
  }
}

module.exports = ManifestConfig;
