import { describe, it, expect, beforeEach } from 'vitest';
import { MCPServer } from './MCPServer';
import type { MCPResourceProvider, MCPToolProvider, MCPPromptProvider } from '@browser-mcp/contracts/mcp-server';

describe('MCPServer', () => {
  let server: MCPServer;

  beforeEach(() => {
    server = new MCPServer({
      name: 'Browser MCP Server',
      version: '1.0.0',
    });
  });

  describe('initialize', () => {
    it('should initialize with server info and capabilities', async () => {
      const info = await server.initialize();

      expect(info.name).toBe('Browser MCP Server');
      expect(info.version).toBe('1.0.0');
      expect(info.capabilities.resources).toBe(true);
      expect(info.capabilities.tools).toBe(true);
      expect(info.capabilities.prompts).toBe(true);
    });

    it('should mark server as initialized', async () => {
      expect(server.isInitialized()).toBe(false);

      await server.initialize();

      expect(server.isInitialized()).toBe(true);
    });
  });

  describe('Resource Management', () => {
    beforeEach(async () => {
      await server.initialize();
    });

    it('should register a resource provider', () => {
      const provider: MCPResourceProvider = {
        uri: 'browser://tab-localhost-3000/',
        name: 'Tab: localhost:3000',
        description: 'Virtual filesystem for localhost:3000',
        mimeType: 'text/html',
        getContent: async () => '<html><body>Test</body></html>',
      };

      server.registerResource(provider);

      // Verify by listing resources
      const resources = server.listResources();
      expect(resources).resolves.toHaveLength(1);
    });

    it('should list all registered resources', async () => {
      const provider1: MCPResourceProvider = {
        uri: 'browser://tab-localhost-3000/',
        name: 'Tab 1',
        getContent: async () => 'Content 1',
      };

      const provider2: MCPResourceProvider = {
        uri: 'browser://tab-example-com/',
        name: 'Tab 2',
        getContent: async () => 'Content 2',
      };

      server.registerResource(provider1);
      server.registerResource(provider2);

      const resources = await server.listResources();

      expect(resources).toHaveLength(2);
      expect(resources[0].uri).toBe('browser://tab-localhost-3000/');
      expect(resources[1].uri).toBe('browser://tab-example-com/');
    });

    it('should get resource content by URI', async () => {
      const provider: MCPResourceProvider = {
        uri: 'browser://tab-localhost-3000/',
        name: 'Tab',
        getContent: async () => '<html><body>Hello World</body></html>',
      };

      server.registerResource(provider);

      const content = await server.getResourceContent('browser://tab-localhost-3000/');

      expect(content).toBe('<html><body>Hello World</body></html>');
    });

    it('should throw error for non-existent resource', async () => {
      await expect(
        server.getResourceContent('browser://non-existent/')
      ).rejects.toThrow('Resource not found');
    });

    it('should unregister a resource by URI', async () => {
      const provider: MCPResourceProvider = {
        uri: 'browser://tab-localhost-3000/',
        name: 'Tab',
        getContent: async () => 'Content',
      };

      server.registerResource(provider);
      expect((await server.listResources()).length).toBe(1);

      server.unregisterResource('browser://tab-localhost-3000/');

      expect((await server.listResources()).length).toBe(0);
    });

    it('should replace resource with same URI', async () => {
      const provider1: MCPResourceProvider = {
        uri: 'browser://tab-localhost-3000/',
        name: 'Tab Old',
        getContent: async () => 'Old Content',
      };

      const provider2: MCPResourceProvider = {
        uri: 'browser://tab-localhost-3000/',
        name: 'Tab New',
        getContent: async () => 'New Content',
      };

      server.registerResource(provider1);
      server.registerResource(provider2);

      const resources = await server.listResources();
      expect(resources).toHaveLength(1);

      const content = await server.getResourceContent('browser://tab-localhost-3000/');
      expect(content).toBe('New Content');
    });
  });

  describe('Tool Management', () => {
    beforeEach(async () => {
      await server.initialize();
    });

    it('should register a tool provider', async () => {
      const tool: MCPToolProvider = {
        name: 'executeScript',
        description: 'Execute JavaScript in tab',
        inputSchema: {
          type: 'object',
          properties: {
            tabId: { type: 'number' },
            script: { type: 'string' },
          },
          required: ['tabId', 'script'],
        },
        execute: async (params) => ({
          success: true,
          result: 'Executed',
        }),
      };

      server.registerTool(tool);

      const tools = await server.listTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('executeScript');
    });

    it('should list all registered tools', async () => {
      const tool1: MCPToolProvider = {
        name: 'executeScript',
        description: 'Execute JavaScript',
        inputSchema: {},
        execute: async () => ({ success: true }),
      };

      const tool2: MCPToolProvider = {
        name: 'navigateTab',
        description: 'Navigate to URL',
        inputSchema: {},
        execute: async () => ({ success: true }),
      };

      server.registerTool(tool1);
      server.registerTool(tool2);

      const tools = await server.listTools();

      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('executeScript');
      expect(tools[1].name).toBe('navigateTab');
    });

    it('should execute a tool by name', async () => {
      const tool: MCPToolProvider = {
        name: 'add',
        description: 'Add two numbers',
        inputSchema: {},
        execute: async (params) => ({
          success: true,
          data: params.a + params.b,
        }),
      };

      server.registerTool(tool);

      const result = await server.executeTool('add', { a: 2, b: 3 });

      expect(result.success).toBe(true);
      expect(result.data).toBe(5);
    });

    it('should throw error for non-existent tool', async () => {
      await expect(
        server.executeTool('nonExistent', {})
      ).rejects.toThrow('Tool not found');
    });

    it('should unregister a tool by name', async () => {
      const tool: MCPToolProvider = {
        name: 'test',
        description: 'Test tool',
        inputSchema: {},
        execute: async () => ({ success: true }),
      };

      server.registerTool(tool);
      expect((await server.listTools()).length).toBe(1);

      server.unregisterTool('test');

      expect((await server.listTools()).length).toBe(0);
    });
  });

  describe('Prompt Management', () => {
    beforeEach(async () => {
      await server.initialize();
    });

    it('should register a prompt provider', async () => {
      const prompt: MCPPromptProvider = {
        name: 'analyzeTab',
        description: 'Analyze tab content',
        arguments: [
          { name: 'tabId', description: 'Tab ID', required: true },
        ],
        generate: async (args) => `Analyze tab ${args.tabId}`,
      };

      server.registerPrompt(prompt);

      const prompts = await server.listPrompts();
      expect(prompts).toHaveLength(1);
      expect(prompts[0].name).toBe('analyzeTab');
    });

    it('should list all registered prompts', async () => {
      const prompt1: MCPPromptProvider = {
        name: 'analyzeTab',
        description: 'Analyze tab',
        generate: async () => 'Analyze this tab',
      };

      const prompt2: MCPPromptProvider = {
        name: 'debugScript',
        description: 'Debug JavaScript',
        generate: async () => 'Debug this script',
      };

      server.registerPrompt(prompt1);
      server.registerPrompt(prompt2);

      const prompts = await server.listPrompts();

      expect(prompts).toHaveLength(2);
      expect(prompts[0].name).toBe('analyzeTab');
      expect(prompts[1].name).toBe('debugScript');
    });

    it('should get a prompt by name with arguments', async () => {
      const prompt: MCPPromptProvider = {
        name: 'greet',
        description: 'Generate greeting',
        arguments: [
          { name: 'name', description: 'Name to greet', required: true },
        ],
        generate: async (args) => `Hello, ${args.name}!`,
      };

      server.registerPrompt(prompt);

      const result = await server.getPrompt('greet', { name: 'Alice' });

      expect(result).toBe('Hello, Alice!');
    });

    it('should throw error for non-existent prompt', async () => {
      await expect(
        server.getPrompt('nonExistent', {})
      ).rejects.toThrow('Prompt not found');
    });

    it('should unregister a prompt by name', async () => {
      const prompt: MCPPromptProvider = {
        name: 'test',
        description: 'Test prompt',
        generate: async () => 'Test content',
      };

      server.registerPrompt(prompt);
      expect((await server.listPrompts()).length).toBe(1);

      server.unregisterPrompt('test');

      expect((await server.listPrompts()).length).toBe(0);
    });
  });

  describe('shutdown', () => {
    it('should shutdown and clear all registrations', async () => {
      await server.initialize();

      server.registerResource({
        uri: 'test://resource',
        name: 'Test',
        getContent: async () => 'Content',
      });

      server.registerTool({
        name: 'test',
        description: 'Test',
        inputSchema: {},
        execute: async () => ({ success: true }),
      });

      server.registerPrompt({
        name: 'test',
        description: 'Test',
        generate: async () => 'Test content',
      });

      await server.shutdown();

      expect(server.isInitialized()).toBe(false);
      expect((await server.listResources()).length).toBe(0);
      expect((await server.listTools()).length).toBe(0);
      expect((await server.listPrompts()).length).toBe(0);
    });
  });
});
