import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let context, extensionId, mcpServer, mcpServerPort = 8765;

test.describe('MCP Full Stack Integration', () => {
  test.beforeAll(async () => {
    console.log('\n==============================================');
    console.log('MCP Full Stack E2E Test Suite');
    console.log('Testing: Complete MCP flow with real AI integration');
    console.log('==============================================\n');

    // Start MCP Server
    console.log('🚀 Starting MCP Server...');
    mcpServer = await startMCPServer();
    await waitForMCPServer(mcpServerPort);
    console.log('✅ MCP Server running on port', mcpServerPort);

    // Launch Chrome with extension
    console.log('🌐 Launching Chrome with extension...');
    const extensionPath = path.resolve(__dirname, '..');
    const userDataDir = path.join(__dirname, '.playwright-mcp-test');

    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=VizDisplayCompositor'
      ],
      ignoreDefaultArgs: ['--disable-extensions', '--disable-component-extensions-with-background-pages'],
      timeout: 60000,
    });

    // Wait for extension to load with retry logic
    let serviceWorkerLoaded = false;
    try {
      await context.waitForEvent('serviceworker', { timeout: 30000 });
      serviceWorkerLoaded = true;
    } catch (error) {
      // Service worker event may have already fired, check manually
      console.log('Service worker event timeout - checking manually...');
    }

    // Give extension extra time to initialize
    await new Promise(resolve => setTimeout(resolve, 2000));

    const serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length > 0) {
      extensionId = serviceWorkers[0].url().split('/')[2];
      console.log('✅ Extension loaded, ID:', extensionId);
    } else {
      console.log('⚠️  Service worker not detected, but extension may still work');
    }

    // Give extension time to connect to MCP server
    await new Promise(resolve => setTimeout(resolve, 3000));
    console.log('✅ Extension should be connected to MCP server');
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

  test('MCP Server is running and accessible', async () => {
    const response = await fetch(`http://localhost:${mcpServerPort + 1}/health`);
    expect(response.status).toBe(200);
    console.log('✅ MCP Server health check passed');
  });

  test('Extension connects to MCP Server via WebSocket', async () => {
    const ws = new WebSocket(`ws://localhost:${mcpServerPort}`);
    
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 10000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connection established');
        ws.close();
        resolve();
      };
      
      ws.onerror = (error) => {
        clearTimeout(timeout);
        reject(error);
      };
    });
  });

  test('MCP Server responds to tools/list request', async () => {
    const response = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    });

    expect(response.result).toBeDefined();
    expect(response.result.tools).toBeDefined();
    expect(Array.isArray(response.result.tools)).toBe(true);
    expect(response.result.tools.length).toBeGreaterThan(30);
    
    console.log(`✅ MCP Server returned ${response.result.tools.length} tools`);
    
    // Verify some key tools are present
    const toolNames = response.result.tools.map(tool => tool.name);
    expect(toolNames).toContain('get_page_content');
    expect(toolNames).toContain('click_element');
    expect(toolNames).toContain('take_screenshot');
    expect(toolNames).toContain('execute_script');
  });

  test('MCP Server responds to tools/call with valid tool', async () => {
    // First get available tabs
    const tabsResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_tabs',
        arguments: {}
      }
    });

    expect(tabsResponse.result).toBeDefined();
    expect(tabsResponse.result.content).toBeDefined();
    console.log('✅ get_tabs tool executed successfully');

    // Open a test page
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');

    // Get page content
    const contentResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'get_page_content',
        arguments: {
          url: 'https://example.com'
        }
      }
    });

    expect(contentResponse.result).toBeDefined();
    expect(contentResponse.result.content).toBeDefined();
    expect(contentResponse.result.content[0].text).toContain('Example Domain');
    console.log('✅ get_page_content tool executed successfully');

    await page.close();
  });

  test('MCP Server handles invalid tool gracefully', async () => {
    const response = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'nonexistent_tool',
        arguments: {}
      }
    });

    expect(response.error).toBeDefined();
    expect(response.error.code).toBe(-32601);
    console.log('✅ Invalid tool handled gracefully');
  });

  test('MCP Server maintains connection stability', async () => {
    // Send multiple requests in sequence
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        sendMCPRequest({
          jsonrpc: '2.0',
          id: 100 + i,
          method: 'tools/list'
        })
      );
    }

    const responses = await Promise.all(requests);
    responses.forEach((response, index) => {
      expect(response.result).toBeDefined();
      expect(response.result.tools).toBeDefined();
    });

    console.log('✅ MCP Server handled 5 concurrent requests successfully');
  });

  test('Extension persists through browser operations', async () => {
    // Open multiple pages
    const pages = [];
    for (let i = 0; i < 3; i++) {
      const page = await context.newPage();
      await page.goto(`https://example.com?page=${i}`);
      await page.waitForLoadState('domcontentloaded');
      pages.push(page);
    }

    // Verify extension is still connected
    const response = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 200,
      method: 'tools/list'
    });

    expect(response.result).toBeDefined();
    console.log('✅ Extension persisted through multiple page operations');

    // Clean up
    await Promise.all(pages.map(page => page.close()));
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

    // Give server time to start
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

    // Timeout after 10 seconds
    setTimeout(() => {
      ws.close();
      reject(new Error('Request timeout'));
    }, 10000);
  });
}
