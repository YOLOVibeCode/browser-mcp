import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';
import WebSocket from 'ws';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let context, extensionId, mcpServer, mcpServerPort = 8765;

test.describe('AI Assistant Integration', () => {
  test.beforeAll(async () => {
    console.log('\n==============================================');
    console.log('AI Assistant Integration Test Suite');
    console.log('Testing: Real AI assistant using MCP tools');
    console.log('==============================================\n');

    // Start MCP Server
    console.log('🚀 Starting MCP Server...');
    mcpServer = await startMCPServer();
    await waitForMCPServer(mcpServerPort);
    console.log('✅ MCP Server running on port', mcpServerPort);

    // Launch Chrome with extension
    console.log('🌐 Launching Chrome with extension...');
    const extensionPath = path.resolve(__dirname, '..');
    const userDataDir = path.join(__dirname, '.playwright-ai-test');

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

  test('AI Assistant can discover available tools', async () => {
    const toolsResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/list'
    });

    expect(toolsResponse.result).toBeDefined();
    expect(toolsResponse.result.tools).toBeDefined();
    
    const tools = toolsResponse.result.tools;
    console.log(`✅ AI Assistant discovered ${tools.length} available tools`);
    
    // Log some key tools for AI assistant
    const keyTools = tools.filter(tool => 
      ['get_page_content', 'click_element', 'take_screenshot', 'execute_script', 'get_tabs'].includes(tool.name)
    );
    console.log('🔧 Key tools available:', keyTools.map(t => t.name).join(', '));
  });

  test('AI Assistant can navigate and interact with web pages', async () => {
    // Open a test page
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');

    // AI Assistant workflow: Get page content
    const contentResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'get_page_content',
        arguments: {
          url: 'https://example.com'
        }
      }
    });

    expect(contentResponse.result).toBeDefined();
    const content = contentResponse.result.content[0].text;
    expect(content).toContain('Example Domain');
    console.log('✅ AI Assistant successfully retrieved page content');

    // AI Assistant workflow: Take screenshot
    const screenshotResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'take_screenshot',
        arguments: {
          url: 'https://example.com'
        }
      }
    });

    expect(screenshotResponse.result).toBeDefined();
    expect(screenshotResponse.result.content[0].type).toBe('image');
    console.log('✅ AI Assistant successfully took screenshot');

    await page.close();
  });

  test('AI Assistant can execute JavaScript on pages', async () => {
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');

    // AI Assistant workflow: Execute JavaScript
    const scriptResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'execute_script',
        arguments: {
          url: 'https://example.com',
          script: 'document.title = "AI Modified Title"; return document.title;'
        }
      }
    });

    expect(scriptResponse.result).toBeDefined();
    expect(scriptResponse.result.content[0].text).toBe('AI Modified Title');
    console.log('✅ AI Assistant successfully executed JavaScript');

    // Verify the change took effect
    expect(await page.title()).toBe('AI Modified Title');
    console.log('✅ Page title was successfully modified by AI Assistant');

    await page.close();
  });

  test('AI Assistant can manage multiple tabs', async () => {
    // Open multiple pages
    const page1 = await context.newPage();
    const page2 = await context.newPage();
    
    await page1.goto('https://example.com');
    await page2.goto('https://www.google.com');
    
    await Promise.all([
      page1.waitForLoadState('domcontentloaded'),
      page2.waitForLoadState('domcontentloaded')
    ]);

    // AI Assistant workflow: Get all tabs
    const tabsResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'get_tabs',
        arguments: {}
      }
    });

    expect(tabsResponse.result).toBeDefined();
    const tabs = tabsResponse.result.content[0].text;
    expect(tabs).toContain('example.com');
    expect(tabs).toContain('google.com');
    console.log('✅ AI Assistant successfully managed multiple tabs');

    await Promise.all([page1.close(), page2.close()]);
  });

  test('AI Assistant can perform complex multi-step operations', async () => {
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');

    // Step 1: Get initial content
    const initialContent = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {
        name: 'get_page_content',
        arguments: {
          url: 'https://example.com'
        }
      }
    });

    expect(initialContent.result).toBeDefined();
    console.log('✅ Step 1: Retrieved initial page content');

    // Step 2: Execute script to modify page
    const modifyResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 7,
      method: 'tools/call',
      params: {
        name: 'execute_script',
        arguments: {
          url: 'https://example.com',
          script: `
            const heading = document.querySelector('h1');
            if (heading) {
              heading.textContent = 'AI Assistant Modified This Page';
              heading.style.color = 'red';
            }
            return 'Page modified successfully';
          `
        }
      }
    });

    expect(modifyResponse.result).toBeDefined();
    console.log('✅ Step 2: Modified page content');

    // Step 3: Take screenshot of modified page
    const screenshotResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 8,
      method: 'tools/call',
      params: {
        name: 'take_screenshot',
        arguments: {
          url: 'https://example.com'
        }
      }
    });

    expect(screenshotResponse.result).toBeDefined();
    console.log('✅ Step 3: Captured screenshot of modified page');

    // Step 4: Verify changes
    const finalContent = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 9,
      method: 'tools/call',
      params: {
        name: 'get_page_content',
        arguments: {
          url: 'https://example.com'
        }
      }
    });

    expect(finalContent.result).toBeDefined();
    const content = finalContent.result.content[0].text;
    expect(content).toContain('AI Assistant Modified This Page');
    console.log('✅ Step 4: Verified changes were applied');

    console.log('🎉 AI Assistant successfully completed complex multi-step operation!');
    await page.close();
  });

  test('AI Assistant handles errors gracefully', async () => {
    // Test with invalid URL
    const errorResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 10,
      method: 'tools/call',
      params: {
        name: 'get_page_content',
        arguments: {
          url: 'https://nonexistent-domain-12345.com'
        }
      }
    });

    expect(errorResponse.error).toBeDefined();
    console.log('✅ AI Assistant handled invalid URL gracefully');

    // Test with invalid tool
    const invalidToolResponse = await sendMCPRequest({
      jsonrpc: '2.0',
      id: 11,
      method: 'tools/call',
      params: {
        name: 'invalid_tool_name',
        arguments: {}
      }
    });

    expect(invalidToolResponse.error).toBeDefined();
    console.log('✅ AI Assistant handled invalid tool gracefully');
  });
});

// Helper functions (same as previous test)
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
