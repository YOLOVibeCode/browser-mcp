#!/usr/bin/env node

import {
  MCPServer,
  EventEmitterBus,
  PortManager,
  TabManager,
  SessionManager,
  StdioTransport,
  VirtualFilesystemProvider
} from '@browser-mcp/infrastructure';

import type {
  MCPToolProvider,
  MCPResourceProvider,
  ITabManager,
  ISessionManager,
  IEventBus,
  JSONRPCRequest
} from '@browser-mcp/contracts';

/**
 * Browser MCP Server Entry Point
 *
 * This server exposes browser state to AI assistants via the Model Context Protocol.
 * It provides:
 * - Resources: Virtual filesystem access to browser tabs
 * - Tools: Execute JavaScript, navigate tabs, inspect DOM
 * - Prompts: Pre-built prompts for common browser tasks
 */

async function main() {
  console.error('🚀 Starting Browser MCP Server...');

  // Initialize infrastructure
  const eventBus = new EventEmitterBus();
  const portManager = new PortManager();
  const tabManager = new TabManager(eventBus);
  const sessionManager = new SessionManager();
  const virtualFS = new VirtualFilesystemProvider();

  // Initialize MCP server
  const mcpServer = new MCPServer({
    name: 'Browser MCP Server',
    version: '1.0.15',
  });

  // Initialize stdio transport
  const transport = new StdioTransport();

  const serverInfo = await mcpServer.initialize();
  console.error(`✅ ${serverInfo.name} v${serverInfo.version} initialized`);
  console.error(`   Capabilities: ${JSON.stringify(serverInfo.capabilities)}`);

  // Register example tools
  registerTools(mcpServer, tabManager, sessionManager, eventBus);

  // Register example prompts
  registerPrompts(mcpServer);

  // Listen for tab events to register/unregister resources
  eventBus.on('TabActivated', (payload: any) => {
    console.error(`📑 Tab activated: ${payload.tabId} (${payload.url})`);

    // Create virtual filesystem resources for this tab
    const resources = virtualFS.createResourcesForTab(payload.tabId, payload.url);

    // Register all resources with MCP server
    resources.forEach(resource => {
      mcpServer.registerResource(resource);
      console.error(`   Resource registered: ${resource.uri}`);
    });
  });

  eventBus.on('TabDeactivated', (payload: any) => {
    console.error(`📑 Tab deactivated: ${payload.tabId}`);

    const baseURI = virtualFS.getBaseURI(payload.url);
    // Unregister all resources for this tab
    mcpServer.unregisterResource(`${baseURI}dom/html`);
    mcpServer.unregisterResource(`${baseURI}console/logs`);
    mcpServer.unregisterResource(`${baseURI}network/requests`);
    mcpServer.unregisterResource(`${baseURI}metadata/frameworks`);
    virtualFS.clearTab(payload.tabId);
    console.error(`   Resources unregistered for tab ${payload.tabId}`);
  });

  // Handle JSON-RPC requests from stdin
  transport.onRequest(async (request: JSONRPCRequest) => {
    const requestId = request.id || 'unknown';
    const timestamp = new Date().toISOString();

    console.error(`\n${'─'.repeat(60)}`);
    console.error(`📥 [${timestamp}] REQUEST ID: ${requestId}`);
    console.error(`   Method: ${request.method}`);
    console.error(`   Params: ${JSON.stringify(request.params || {}, null, 2)}`);

    try {
      let result: any;

      switch (request.method) {
        case 'initialize':
          console.error(`   ↳ Returning server info`);
          result = serverInfo;
          break;

        case 'resources/list':
          const resources = await mcpServer.listResources();
          console.error(`   ↳ Found ${resources.length} resources`);
          result = { resources };
          break;

        case 'resources/read':
          const uri = request.params?.uri;
          if (!uri) throw new Error('Missing uri parameter');
          console.error(`   ↳ Reading resource: ${uri}`);
          const content = await mcpServer.getResourceContent(uri);
          console.error(`   ↳ Content length: ${content.length} chars`);
          result = { contents: [{ uri, mimeType: 'text/plain', text: content }] };
          break;

        case 'tools/list':
          const tools = await mcpServer.listTools();
          console.error(`   ↳ Found ${tools.length} tools`);
          result = { tools };
          break;

        case 'tools/call':
          const toolName = request.params?.name;
          const toolParams = request.params?.arguments || {};
          if (!toolName) throw new Error('Missing name parameter');
          console.error(`   ↳ Executing tool: ${toolName}`);
          console.error(`   ↳ Tool params: ${JSON.stringify(toolParams, null, 2)}`);
          result = await mcpServer.executeTool(toolName, toolParams);
          console.error(`   ↳ Tool result: ${JSON.stringify(result, null, 2)}`);
          break;

        case 'prompts/list':
          const prompts = await mcpServer.listPrompts();
          console.error(`   ↳ Found ${prompts.length} prompts`);
          result = { prompts };
          break;

        case 'prompts/get':
          const promptName = request.params?.name;
          const promptArgs = request.params?.arguments || {};
          if (!promptName) throw new Error('Missing name parameter');
          console.error(`   ↳ Getting prompt: ${promptName}`);
          const prompt = await mcpServer.getPrompt(promptName, promptArgs);
          result = { description: prompt, messages: [{ role: 'user', content: { type: 'text', text: prompt } }] };
          break;

        default:
          throw new Error(`Unknown method: ${request.method}`);
      }

      console.error(`✅ [${new Date().toISOString()}] RESPONSE ID: ${requestId}`);
      console.error(`   Status: Success`);
      console.error(`${'─'.repeat(60)}\n`);

      return result;
    } catch (error: any) {
      console.error(`❌ [${new Date().toISOString()}] ERROR ID: ${requestId}`);
      console.error(`   Method: ${request.method}`);
      console.error(`   Error: ${error.message}`);
      console.error(`   Stack: ${error.stack || 'No stack trace'}`);
      console.error(`${'─'.repeat(60)}\n`);
      throw error;
    }
  });

  // Start the transport
  transport.start();
  console.error('\n🎯 MCP Server ready! Listening on stdio...');
  console.error('   Send JSON-RPC requests via stdin.');
  console.error('   Press Ctrl+C to shutdown.\n');

  // Simulate a tab activation for demo
  await simulateTabActivation(tabManager, portManager);

  // Keep server running
  process.on('SIGINT', async () => {
    console.error('\n\n🛑 Shutting down MCP Server...');
    transport.stop();
    await mcpServer.shutdown();
    console.error('✅ Shutdown complete');
    process.exit(0);
  });
}

function registerTools(mcpServer: MCPServer, tabManager: ITabManager, sessionManager: ISessionManager, eventBus: IEventBus) {
  // Tool: List active tabs
  const listTabsTool: MCPToolProvider = {
    name: 'listActiveTabs',
    description: 'List all active browser tabs',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const tabs = tabManager.getAllActiveTabs();
      return {
        success: true,
        result: tabs,
      };
    },
  };

  // Tool: Get tab info
  const getTabInfoTool: MCPToolProvider = {
    name: 'getTabInfo',
    description: 'Get information about a specific tab',
    inputSchema: {
      type: 'object',
      properties: {
        tabId: { type: 'number', description: 'Tab ID' },
      },
      required: ['tabId'],
    },
    execute: async (params: any) => {
      const info = tabManager.getTabInfo(params.tabId);
      if (!info) {
        return {
          success: false,
          error: `Tab ${params.tabId} not found`,
        };
      }
      return {
        success: true,
        result: info,
      };
    },
  };

  // Tool: Pin tab to session
  const pinTabTool: MCPToolProvider = {
    name: 'pinTab',
    description: 'Pin a specific tab to this IDE session for focused context',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID (unique per IDE window)' },
        tabId: { type: 'number', description: 'Tab ID to pin' },
      },
      required: ['sessionId', 'tabId'],
    },
    execute: async (params: any) => {
      const tabInfo = tabManager.getTabInfo(params.tabId);
      if (!tabInfo) {
        return {
          success: false,
          error: `Tab ${params.tabId} not found`,
        };
      }

      sessionManager.pinTab(params.sessionId, params.tabId);

      return {
        success: true,
        data: {
          message: `Tab ${params.tabId} pinned to session ${params.sessionId}`,
          tab: tabInfo,
        },
      };
    },
  };

  // Tool: Unpin tab from session
  const unpinTabTool: MCPToolProvider = {
    name: 'unpinTab',
    description: 'Unpin the tab from this IDE session',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
      },
      required: ['sessionId'],
    },
    execute: async (params: any) => {
      const pinnedTab = sessionManager.getPinnedTab(params.sessionId);

      if (!pinnedTab) {
        return {
          success: false,
          error: `No tab pinned to session ${params.sessionId}`,
        };
      }

      sessionManager.unpinTab(params.sessionId);

      return {
        success: true,
        data: {
          message: `Tab ${pinnedTab} unpinned from session ${params.sessionId}`,
        },
      };
    },
  };

  // Tool: Get pinned tab
  const getPinnedTabTool: MCPToolProvider = {
    name: 'getPinnedTab',
    description: 'Get which tab is pinned to this session',
    inputSchema: {
      type: 'object',
      properties: {
        sessionId: { type: 'string', description: 'Session ID' },
      },
      required: ['sessionId'],
    },
    execute: async (params: any) => {
      const tabId = sessionManager.getPinnedTab(params.sessionId);

      if (!tabId) {
        return {
          success: true,
          data: {
            pinned: false,
            message: 'No tab pinned to this session',
          },
        };
      }

      const tabInfo = tabManager.getTabInfo(tabId);

      return {
        success: true,
        data: {
          pinned: true,
          tabId,
          tab: tabInfo,
        },
      };
    },
  };

  // Tool: List all session bindings
  const listSessionBindingsTool: MCPToolProvider = {
    name: 'listSessionBindings',
    description: 'List all active session-to-tab bindings',
    inputSchema: {
      type: 'object',
      properties: {},
    },
    execute: async () => {
      const bindings = sessionManager.getAllBindings();
      return {
        success: true,
        data: bindings,
      };
    },
  };

  mcpServer.registerTool(listTabsTool);
  mcpServer.registerTool(getTabInfoTool);
  mcpServer.registerTool(pinTabTool);
  mcpServer.registerTool(unpinTabTool);
  mcpServer.registerTool(getPinnedTabTool);
  mcpServer.registerTool(listSessionBindingsTool);

  console.log(`   Registered ${6} tools`);
}

function registerPrompts(mcpServer: MCPServer) {
  mcpServer.registerPrompt({
    name: 'analyzeTab',
    description: 'Generate a prompt to analyze tab content',
    arguments: [
      { name: 'tabId', description: 'Tab ID to analyze', required: true },
    ],
    generate: async (args: Record<string, string>) =>
      `Please analyze the content of browser tab ${args.tabId}. Provide insights about the page structure, frameworks used, and any notable features.`,
  });

  console.log(`   Registered ${1} prompts`);
}

async function simulateTabActivation(tabManager: TabManager, portManager: PortManager) {
  console.log('📋 Simulating tab activation for demo...');

  const tabId = 1;
  const url = 'http://localhost:3000';
  const port = await portManager.findAvailablePort();

  portManager.reservePort(tabId, port);
  await tabManager.activateTab(tabId, url, port);

  console.log(`   Demo tab activated: ${tabId} on port ${port}`);
}

// Start the server
main().catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
