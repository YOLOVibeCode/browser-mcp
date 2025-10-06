import { describe, it, expect } from 'vitest';
import {
  IDE_CONFIGS,
  getOS,
  getExtensionPath,
  getConfigForIDE,
  getConfigPathForIDE,
  generateConfigJSON,
  type OS,
} from './popup-logic';

/**
 * Unit tests for Chrome Extension Setup Wizard Logic
 *
 * Tests the pure business logic functions in isolation.
 * These tests follow TDD principles and test the logic
 * without any DOM manipulation or side effects.
 */

describe('Setup Wizard Logic', () => {
  describe('IDE_CONFIGS', () => {
    it('should have three IDE configurations', () => {
      const ideKeys = Object.keys(IDE_CONFIGS);
      expect(ideKeys).toHaveLength(3);
      expect(ideKeys).toContain('claude');
      expect(ideKeys).toContain('cursor');
      expect(ideKeys).toContain('windsurf');
    });

    it('should have required properties for each IDE', () => {
      Object.values(IDE_CONFIGS).forEach(ideConfig => {
        expect(ideConfig).toHaveProperty('name');
        expect(ideConfig).toHaveProperty('path');
        expect(ideConfig).toHaveProperty('config');

        expect(ideConfig.path).toHaveProperty('mac');
        expect(ideConfig.path).toHaveProperty('linux');
        expect(ideConfig.path).toHaveProperty('windows');

        expect(typeof ideConfig.config).toBe('function');
      });
    });

    it('should have correct IDE names', () => {
      expect(IDE_CONFIGS.claude.name).toBe('Claude Desktop');
      expect(IDE_CONFIGS.cursor.name).toBe('Cursor');
      expect(IDE_CONFIGS.windsurf.name).toBe('Windsurf');
    });
  });

  describe('getOS', () => {
    it('should detect macOS from MacIntel', () => {
      expect(getOS('MacIntel')).toBe('mac');
    });

    it('should detect macOS from Mac', () => {
      expect(getOS('Mac')).toBe('mac');
    });

    it('should detect Linux from Linux x86_64', () => {
      expect(getOS('Linux x86_64')).toBe('linux');
    });

    it('should detect Linux from lowercase linux', () => {
      expect(getOS('linux')).toBe('linux');
    });

    it('should detect Windows from Win32', () => {
      expect(getOS('Win32')).toBe('windows');
    });

    it('should detect Windows from Win64', () => {
      expect(getOS('Win64')).toBe('windows');
    });

    it('should default to Windows for unknown platforms', () => {
      expect(getOS('Unknown')).toBe('windows');
    });

    it('should be case-insensitive', () => {
      expect(getOS('MACINTEL')).toBe('mac');
      expect(getOS('LINUX')).toBe('linux');
    });
  });

  describe('getExtensionPath', () => {
    it('should return a placeholder path', () => {
      const path = getExtensionPath();
      expect(path).toBeTruthy();
      expect(typeof path).toBe('string');
      expect(path).toContain('mcp-server');
      expect(path).toContain('dist');
      expect(path).toContain('index.js');
    });
  });

  describe('getConfigForIDE', () => {
    const testPath = '/test/path/to/mcp-server/dist/index.js';

    it('should generate config for Claude Desktop', () => {
      const config = getConfigForIDE('claude', testPath);

      expect(config).toHaveProperty('mcpServers');
      expect(config.mcpServers).toHaveProperty('browser-inspector');
      expect(config.mcpServers['browser-inspector']).toEqual({
        command: 'node',
        args: [testPath],
        env: {
          NODE_ENV: 'production'
        }
      });
    });

    it('should generate config for Cursor', () => {
      const config = getConfigForIDE('cursor', testPath);

      expect(config).toHaveProperty('mcpServers');
      expect(config.mcpServers).toHaveProperty('browser-inspector');
      expect(config.mcpServers['browser-inspector'].command).toBe('node');
      expect(config.mcpServers['browser-inspector'].args).toEqual([testPath]);
    });

    it('should generate config for Windsurf', () => {
      const config = getConfigForIDE('windsurf', testPath);

      expect(config).toHaveProperty('mcpServers');
      expect(config.mcpServers).toHaveProperty('browser-inspector');
      expect(config.mcpServers['browser-inspector'].env.NODE_ENV).toBe('production');
    });

    it('should throw error for unknown IDE', () => {
      expect(() => getConfigForIDE('unknown', testPath)).toThrow('Unknown IDE: unknown');
    });

    it('should include the extension path in args', () => {
      const customPath = '/custom/path/index.js';
      const config = getConfigForIDE('cursor', customPath);

      expect(config.mcpServers['browser-inspector'].args).toContain(customPath);
    });
  });

  describe('getConfigPathForIDE', () => {
    describe('Claude Desktop', () => {
      it('should return correct path for macOS', () => {
        const path = getConfigPathForIDE('claude', 'mac');
        expect(path).toBe('~/Library/Application Support/Claude/claude_desktop_config.json');
      });

      it('should return correct path for Linux', () => {
        const path = getConfigPathForIDE('claude', 'linux');
        expect(path).toBe('~/.config/Claude/claude_desktop_config.json');
      });

      it('should return correct path for Windows', () => {
        const path = getConfigPathForIDE('claude', 'windows');
        expect(path).toBe('%APPDATA%\\Claude\\claude_desktop_config.json');
      });
    });

    describe('Cursor', () => {
      it('should return correct path for macOS', () => {
        const path = getConfigPathForIDE('cursor', 'mac');
        expect(path).toBe('~/.cursor/mcp.json');
      });

      it('should return correct path for Linux', () => {
        const path = getConfigPathForIDE('cursor', 'linux');
        expect(path).toBe('~/.cursor/mcp.json');
      });

      it('should return correct path for Windows', () => {
        const path = getConfigPathForIDE('cursor', 'windows');
        expect(path).toBe('%USERPROFILE%\\.cursor\\mcp.json');
      });
    });

    describe('Windsurf', () => {
      it('should return correct path for macOS', () => {
        const path = getConfigPathForIDE('windsurf', 'mac');
        expect(path).toBe('~/.codeium/windsurf/mcp_config.json');
      });

      it('should return correct path for Linux', () => {
        const path = getConfigPathForIDE('windsurf', 'linux');
        expect(path).toBe('~/.codeium/windsurf/mcp_config.json');
      });

      it('should return correct path for Windows', () => {
        const path = getConfigPathForIDE('windsurf', 'windows');
        expect(path).toBe('%APPDATA%\\Codeium\\windsurf\\mcp_config.json');
      });
    });

    it('should throw error for unknown IDE', () => {
      expect(() => getConfigPathForIDE('unknown', 'mac')).toThrow('Unknown IDE: unknown');
    });
  });

  describe('generateConfigJSON', () => {
    const testPath = '/test/path/index.js';

    it('should generate valid JSON string', () => {
      const json = generateConfigJSON('cursor', testPath);

      expect(() => JSON.parse(json)).not.toThrow();
    });

    it('should format JSON with 2-space indentation', () => {
      const json = generateConfigJSON('cursor', testPath);
      const lines = json.split('\n');

      // Check for proper indentation (first property should be indented 2 spaces)
      expect(lines[1]).toMatch(/^  "/);
    });

    it('should generate config for all IDEs', () => {
      ['claude', 'cursor', 'windsurf'].forEach(ide => {
        const json = generateConfigJSON(ide, testPath);
        const config = JSON.parse(json);

        expect(config).toHaveProperty('mcpServers');
        expect(config.mcpServers).toHaveProperty('browser-inspector');
      });
    });

    it('should include all required fields in JSON', () => {
      const json = generateConfigJSON('cursor', testPath);
      const config = JSON.parse(json);

      const browserInspector = config.mcpServers['browser-inspector'];
      expect(browserInspector).toHaveProperty('command');
      expect(browserInspector).toHaveProperty('args');
      expect(browserInspector).toHaveProperty('env');
      expect(browserInspector.env).toHaveProperty('NODE_ENV');
    });

    it('should use provided extension path in generated JSON', () => {
      const customPath = '/my/custom/path/server.js';
      const json = generateConfigJSON('windsurf', customPath);
      const config = JSON.parse(json);

      expect(config.mcpServers['browser-inspector'].args).toContain(customPath);
    });

    it('should throw error for unknown IDE', () => {
      expect(() => generateConfigJSON('invalid', testPath)).toThrow();
    });
  });

  describe('Configuration Consistency', () => {
    it('should have consistent structure across all IDEs', () => {
      const testPath = '/test/path/index.js';
      const configs = ['claude', 'cursor', 'windsurf'].map(ide =>
        getConfigForIDE(ide, testPath)
      );

      // All configs should have the same structure
      configs.forEach(config => {
        expect(config.mcpServers['browser-inspector'].command).toBe('node');
        expect(config.mcpServers['browser-inspector'].env.NODE_ENV).toBe('production');
        expect(Array.isArray(config.mcpServers['browser-inspector'].args)).toBe(true);
        expect(config.mcpServers['browser-inspector'].args).toHaveLength(1);
      });
    });

    it('should use same MCP server name for all IDEs', () => {
      const testPath = '/test/path/index.js';

      ['claude', 'cursor', 'windsurf'].forEach(ide => {
        const config = getConfigForIDE(ide, testPath);
        const serverNames = Object.keys(config.mcpServers);

        expect(serverNames).toHaveLength(1);
        expect(serverNames[0]).toBe('browser-inspector');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty extension path', () => {
      const config = getConfigForIDE('cursor', '');
      expect(config.mcpServers['browser-inspector'].args).toEqual(['']);
    });

    it('should handle special characters in extension path', () => {
      const specialPath = '/path/with spaces/and-dashes/file.js';
      const config = getConfigForIDE('cursor', specialPath);
      expect(config.mcpServers['browser-inspector'].args).toContain(specialPath);
    });

    it('should handle Windows-style paths', () => {
      const windowsPath = 'C:\\Users\\Test\\mcp-server\\dist\\index.js';
      const config = getConfigForIDE('cursor', windowsPath);
      expect(config.mcpServers['browser-inspector'].args).toContain(windowsPath);
    });
  });
});
