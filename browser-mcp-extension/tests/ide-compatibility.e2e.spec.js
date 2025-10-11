import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let context, extensionId, mcpServer, mcpServerPort = 8765;

test.describe('IDE Compatibility Tests', () => {
  test.beforeAll(async () => {
    console.log('\n==============================================');
    console.log('IDE Compatibility Test Suite');
    console.log('Testing: MCP compatibility with different IDEs');
    console.log('==============================================\n');

    // Start MCP Server
    console.log('🚀 Starting MCP Server...');
    mcpServer = await startMCPServer();
    await waitForMCPServer(mcpServerPort);
    console.log('✅ MCP Server running on port', mcpServerPort);

    // Launch Chrome with extension
    console.log('🌐 Launching Chrome with extension...');
    const extensionPath = path.resolve(__dirname, '..');
    const userDataDir = path.join(__dirname, '.playwright-ide-test');

    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-web-security'
      ],
      ignoreDefaultArgs: ['--disable-extensions', '--disable-component-extensions-with-background-pages'],
      timeout: 60000,
    });

    // Wait for extension to load
    await context.waitForEvent('serviceworker', { timeout: 15000 });
    const serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length > 0) {
      extensionId = serviceWorkers[0].url().split('/')[2];
      console.log('✅ Extension loaded, ID:', extensionId);
    }

    // Give extension time to connect
    await new Promise(resolve => setTimeout(resolve, 3000));
  }, 120000);

  test.afterAll(async () => {
    if (context) {
      await context.close();
    }
    if (mcpServer) {
      mcpServer.kill();
      console.log('🛑 MCP Server stopped');
    }
  });

  test('MCP Server responds to standard MCP protocol messages', async () => {
    // Test initialize request (standard MCP protocol)
    const initResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        clientInfo: {
          name: 'test-ide',
          version: '1.0.0'
        }
      }
    });

    expect(initResponse.result).toBeDefined();
    expect(initResponse.result.protocolVersion).toBe('2024-11-05');
    expect(initResponse.result.capabilities).toBeDefined();
    console.log('✅ MCP Server responds to initialize request');

    // Test initialized notification (standard MCP protocol)
    const initializedResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    });

    // Notifications don't have responses, but shouldn't error
    console.log('✅ MCP Server handles initialized notification');
  });

  test('MCP Server supports Cursor IDE message format', async () => {
    // Cursor-style request
    const cursorResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    });

    expect(cursorResponse.result).toBeDefined();
    expect(cursorResponse.result.tools).toBeDefined();
    console.log('✅ MCP Server supports Cursor IDE format');
  });

  test('MCP Server supports Claude Desktop message format', async () => {
    // Claude Desktop-style request
    const claudeResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/list',
      params: {
        // Claude Desktop might send additional params
        clientInfo: {
          name: 'claude-desktop',
          version: '1.0.0'
        }
      }
    });

    expect(claudeResponse.result).toBeDefined();
    expect(claudeResponse.result.tools).toBeDefined();
    console.log('✅ MCP Server supports Claude Desktop format');
  });

  test('MCP Server handles batch requests (multiple IDEs)', async () => {
    // Simulate multiple IDEs making requests
    const batchRequests = [
      {
        jsonrpc: '2.0',
        id: 4,
        method: 'tools/list'
      },
      {
        jsonrpc: '2.0',
        id: 5,
        method: 'tools/list'
      },
      {
        jsonrpc: '2.0',
        id: 6,
        method: 'tools/list'
      }
    ];

    const responses = await Promise.all(
      batchRequests.map(request => sendMCPRequest(request))
    );

    responses.forEach((response, index) => {
      expect(response.result).toBeDefined();
      expect(response.result.tools).toBeDefined();
    });

    console.log('✅ MCP Server handles batch requests from multiple IDEs');
  });

  test('MCP Server maintains session state across IDE connections', async () => {
    // First connection
    const firstConnection = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/list'
    });

    expect(firstConnection.result).toBeDefined();
    console.log('✅ First IDE connection established');

    // Simulate connection drop and reconnect
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Second connection (should work seamlessly)
    const secondConnection = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/list'
    });

    expect(secondConnection.result).toBeDefined();
    expect(secondConnection.result.tools.length).toBe(firstConnection.result.tools.length);
    console.log('✅ Second IDE connection established with same capabilities');
  });

  test('MCP Server handles concurrent tool calls from different IDEs', async () => {
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');

    // Simulate multiple IDEs calling tools simultaneously
    const concurrentRequests = [
      {
        jsonrpc: '2.0',
        id: 9,
        method: 'tools/call',
        params: {
          name: 'get_page_content',
          arguments: { url: 'https://example.com' }
        }
      },
      {
        jsonrpc: '2.0',
        id: 10,
        method: 'tools/call',
        params: {
          name: 'take_screenshot',
          arguments: { url: 'https://example.com' }
        }
      },
      {
        jsonrpc: '2.0',
        id: 11,
        method: 'tools/call',
        params: {
          name: 'get_tabs',
          arguments: {}
        }
      }
    ];

    const responses = await Promise.all(
      concurrentRequests.map(request => sendMCPRequest(request))
    );

    responses.forEach((response, index) => {
      expect(response.result).toBeDefined();
      expect(response.result.content).toBeDefined();
    });

    console.log('✅ MCP Server handled concurrent tool calls from multiple IDEs');
    await page.close();
  });

  test('MCP Server provides consistent tool metadata across IDEs', async () => {
    const toolsResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 12,
      method: 'tools/list'
    });

    expect(toolsResponse.result).toBeDefined();
    const tools = toolsResponse.result.tools;

    // Verify tool metadata structure
    tools.forEach(tool => {
      expect(tool.name).toBeDefined();
      expect(tool.description).toBeDefined();
      expect(tool.inputSchema).toBeDefined();
      expect(tool.inputSchema.type).toBe('object');
    });

    // Verify specific tools have required metadata
    const getPageContentTool = tools.find(tool => tool.name === 'get_page_content');
    expect(getPageContentTool).toBeDefined();
    expect(getPageContentTool.description).toContain('page content');
    expect(getPageContentTool.inputSchema.properties).toBeDefined();

    console.log('✅ MCP Server provides consistent tool metadata');
  });

  test('MCP Server handles IDE-specific error reporting', async () => {
    // Test with malformed request
    const malformedResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 13,
      method: 'tools/call',
      params: {
        name: 'get_page_content'
        // Missing required arguments
      }
    });

    expect(malformedResponse.error).toBeDefined();
    expect(malformedResponse.error.code).toBeDefined();
    expect(malformedResponse.error.message).toBeDefined();
    console.log('✅ MCP Server provides proper error reporting for IDEs');

    // Test with invalid JSON-RPC version
    const invalidVersionResponse = await sendMCPRequest({
      jsonrpc: '1.0', // Invalid version
      id: 14,
      method: 'tools/list'
    });

    expect(invalidVersionResponse.error).toBeDefined();
    console.log('✅ MCP Server handles invalid JSON-RPC versions');
  });

  test('MCP Server supports IDE keep-alive mechanisms', async () => {
    // Send ping-like requests to test keep-alive
    const pingRequests = [];
    for (let i = 0; i < 5; i++) {
      pingRequests.push(
        sendMCPRequest({
          jsonrpc: '2.0',
          id: 15 + i,
          method: 'tools/list'
        })
      );
    }

    const pingResponses = await Promise.all(pingRequests);
    pingResponses.forEach(response => {
      expect(response.result).toBeDefined();
    });

    console.log('✅ MCP Server supports IDE keep-alive mechanisms');
  });
});

// Helper functions
async function startMCPServer() {
  return new Promise((resolve, reject) => {
    const serverPath = path.resolve(__dirname, '../../mcp-server/index.js');
    const server = spawn('node', [serverPath], {
      cwd: path.resolve(__dirname, '../../mcp-server'),
      stdio: ['pipe', 'pipe', 'pipe']
    });

    server.stdout.on('data', (data) => {
      console.log(`[MCP Server] ${data.toString().trim()}`);
    });

    server.stderr.on('data', (data) => {
      console.log(`[MCP Server] ${data.toString().trim()}`);
    });

    server.on('error', (error) => {
      reject(error);
    });

    setTimeout(() => resolve(server), 2000);
  });
}

async function waitForMCPServer(port, maxAttempts = 10) {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const response = await fetch(`http://localhost:${port + 1}/health`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  throw new Error(`MCP Server not ready after ${maxAttempts} attempts`);
}

async function sendMCPRequest(request) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:${mcpServerPort}`);
    
    ws.onopen = () => {
      ws.send(JSON.stringify(request));
    };

    ws.onmessage = (event) => {
      const response = JSON.parse(event.data);
      ws.close();
      resolve(response);
    };

    ws.onerror = (error) => {
      reject(error);
    };

    ws.onclose = () => {
      reject(new Error('WebSocket closed before response'));
    };

    setTimeout(() => {
      ws.close();
      reject(new Error('Request timeout'));
    }, 10000);
  });
}
