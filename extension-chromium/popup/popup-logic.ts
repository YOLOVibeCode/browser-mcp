/**
 * Extracted logic functions for testability
 * This file contains the pure business logic separated from DOM manipulation
 */

export interface IDEConfig {
  name: string;
  path: {
    mac: string;
    linux: string;
    windows: string;
  };
  config: (extensionPath: string) => any;
}

export const IDE_CONFIGS: Record<string, IDEConfig> = {
  claude: {
    name: 'Claude Desktop',
    path: {
      mac: '~/Library/Application Support/Claude/claude_desktop_config.json',
      linux: '~/.config/Claude/claude_desktop_config.json',
      windows: '%APPDATA%\\Claude\\claude_desktop_config.json'
    },
    config: (extensionPath: string) => ({
      mcpServers: {
        'browser-inspector': {
          command: 'node',
          args: [extensionPath],
          env: {
            NODE_ENV: 'production'
          }
        }
      }
    })
  },
  cursor: {
    name: 'Cursor',
    path: {
      mac: '~/.cursor/mcp.json',
      linux: '~/.cursor/mcp.json',
      windows: '%USERPROFILE%\\.cursor\\mcp.json'
    },
    config: (extensionPath: string) => ({
      mcpServers: {
        'browser-inspector': {
          command: 'node',
          args: [extensionPath],
          env: {
            NODE_ENV: 'production'
          }
        }
      }
    })
  },
  windsurf: {
    name: 'Windsurf',
    path: {
      mac: '~/.codeium/windsurf/mcp_config.json',
      linux: '~/.codeium/windsurf/mcp_config.json',
      windows: '%APPDATA%\\Codeium\\windsurf\\mcp_config.json'
    },
    config: (extensionPath: string) => ({
      mcpServers: {
        'browser-inspector': {
          command: 'node',
          args: [extensionPath],
          env: {
            NODE_ENV: 'production'
          }
        }
      }
    })
  }
};

export type OS = 'mac' | 'linux' | 'windows';

export function getOS(platform: string): OS {
  const platformLower = platform.toLowerCase();
  if (platformLower.includes('mac')) return 'mac';
  if (platformLower.includes('linux')) return 'linux';
  return 'windows';
}

export function getExtensionPath(): string {
  return '<YOUR_PROJECT_PATH>/mcp-server/dist/index.js';
}

export function getConfigForIDE(ide: string, extensionPath: string): any {
  const ideConfig = IDE_CONFIGS[ide];
  if (!ideConfig) {
    throw new Error(`Unknown IDE: ${ide}`);
  }
  return ideConfig.config(extensionPath);
}

export function getConfigPathForIDE(ide: string, os: OS): string {
  const ideConfig = IDE_CONFIGS[ide];
  if (!ideConfig) {
    throw new Error(`Unknown IDE: ${ide}`);
  }
  return ideConfig.path[os];
}

export function generateConfigJSON(ide: string, extensionPath: string): string {
  const config = getConfigForIDE(ide, extensionPath);
  return JSON.stringify(config, null, 2);
}
