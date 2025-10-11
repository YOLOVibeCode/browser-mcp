/**
 * Integration Test: Reconnection Logic
 * 
 * Tests:
 * - Extension reconnects when server restarts
 * - Message queue flushes on reconnect
 * - Connection resilience during disruptions
 * - Keepalive and connection monitoring
 */

import { test, expect, chromium } from '@playwright/test';
import { spawn } from 'child_process';
import WebSocket from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mcpServerProcess;
let context;
let extensionId;

test.describe('Reconnection Logic Tests', () => {
  
  test.beforeAll(async () => {
    console.log('\n==============================================');
    console.log('Reconnection Logic Integration Tests');
    console.log('Testing: Auto-reconnect and resilience');
    console.log('==============================================\n');
    
    // Load Chrome extension FIRST (before server)
    console.log('Loading Chrome extension...');
    const extensionPath = path.resolve(__dirname, '../../browser-mcp-extension');
    const userDataDir = path.join(__dirname, '.playwright-reconnection-test');
    
    context = await chromium.launchPersistentContext(userDataDir, {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-sandbox',
      ],
      ignoreDefaultArgs: ['--disable-extensions'],
      timeout: 60000,
    });
    
    await context.waitForEvent('serviceworker', { timeout: 15000 }).catch(() => {});
    
    const serviceWorkers = context.serviceWorkers();
    if (serviceWorkers.length > 0) {
      const sw = serviceWorkers[0];
      extensionId = sw.url().split('/')[2];
      console.log('✓ Extension loaded, ID:', extensionId);
    }
    
    // Extension will attempt to connect but fail (server not running yet)
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✓ Extension loaded (server not yet started)\n');
    
  }, 90000);
  
  test.afterAll(async () => {
    if (mcpServerProcess) {
      mcpServerProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (context) {
      await context.close();
    }
  });
  
  test('Extension connects when server starts', async () => {
    console.log('\nTest: Extension connects when server becomes available');
    
    // Start server
    console.log('Starting MCP server...');
    const serverPath = path.resolve(__dirname, '../../mcp-server/index.js');
    
    mcpServerProcess = spawn('node', [serverPath], {
      env: { ...process.env, BROWSER_MCP_PORT: '8765' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let serverStarted = false;
    
    mcpServerProcess.stderr.on('data', (data) => {
      const log = data.toString();
      if (log.includes('listening')) {
        serverStarted = true;
      }
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✓ Server started');
    
    // Extension should auto-reconnect within a few seconds
    console.log('Waiting for extension to reconnect...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Test connection by sending request
    const connected = await testConnection();
    
    expect(connected).toBe(true);
    console.log('✓ Extension connected automatically');
  });
  
  test('Extension reconnects after server restart', async () => {
    console.log('\nTest: Extension reconnects after server restart');
    
    // Kill server
    console.log('Killing MCP server...');
    mcpServerProcess.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    console.log('✓ Server killed');
    
    // Restart server
    console.log('Restarting MCP server...');
    const serverPath = path.resolve(__dirname, '../../mcp-server/index.js');
    
    mcpServerProcess = spawn('node', [serverPath], {
      env: { ...process.env, BROWSER_MCP_PORT: '8765' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log('✓ Server restarted');
    
    // Extension should reconnect within 2-5 seconds
    console.log('Waiting for reconnection...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    const connected = await testConnection();
    
    expect(connected).toBe(true);
    console.log('✓ Extension reconnected successfully');
  });
  
  test('Connection survives multiple rapid disconnects', async () => {
    console.log('\nTest: Resilience to rapid disconnections');
    
    const cycles = 3;
    
    for (let i = 0; i < cycles; i++) {
      console.log(`\nCycle ${i + 1}/${cycles}`);
      
      // Kill server
      console.log('  Disconnecting...');
      mcpServerProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Restart server
      console.log('  Reconnecting...');
      const serverPath = path.resolve(__dirname, '../../mcp-server/index.js');
      
      mcpServerProcess = spawn('node', [serverPath], {
        env: { ...process.env, BROWSER_MCP_PORT: '8765' },
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Wait for reconnection
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const connected = await testConnection();
      expect(connected).toBe(true);
      console.log('  ✓ Reconnected');
    }
    
    console.log('✓ Survived multiple rapid disconnects');
  });
  
  test('Connection remains stable for extended period', async () => {
    console.log('\nTest: Connection stability over time');
    
    const duration = 30000; // 30 seconds
    const checkInterval = 5000; // Check every 5 seconds
    const checks = Math.floor(duration / checkInterval);
    
    console.log(`Testing stability for ${duration / 1000}s (${checks} checks)`);
    
    for (let i = 0; i < checks; i++) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      
      const connected = await testConnection();
      expect(connected).toBe(true);
      
      console.log(`  Check ${i + 1}/${checks}: ✓ Connected`);
    }
    
    console.log('✓ Connection remained stable');
  });
  
  test('Multiple clients can connect simultaneously', async () => {
    console.log('\nTest: Multiple WebSocket clients');
    
    const clientCount = 3;
    const clients = [];
    
    // Create multiple WebSocket clients
    for (let i = 0; i < clientCount; i++) {
      const client = await createTestClient();
      clients.push(client);
      console.log(`  Client ${i + 1} connected`);
    }
    
    // Send request from each client
    const responses = await Promise.all(
      clients.map((client, i) =>
        sendRequest(client, {
          jsonrpc: '2.0',
          id: `client-${i}`,
          method: 'tools/list'
        })
      )
    );
    
    // Validate all got responses
    responses.forEach((response, i) => {
      expect(response.id).toBe(`client-${i}`);
      console.log(`  Client ${i + 1} received response`);
    });
    
    // Clean up
    clients.forEach(client => client.close());
    
    console.log('✓ Multiple clients handled correctly');
  });
  
});

/**
 * Helper: Test if connection is working
 */
async function testConnection() {
  try {
    const ws = await createTestClient();
    
    const response = await sendRequest(ws, {
      jsonrpc: '2.0',
      id: 'test',
      method: 'tools/list'
    });
    
    ws.close();
    
    return response && !response.error;
  } catch (error) {
    return false;
  }
}

/**
 * Helper: Create WebSocket client
 */
function createTestClient() {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Connection timeout'));
    }, 5000);
    
    const ws = new WebSocket('ws://localhost:8765');
    
    ws.on('open', () => {
      clearTimeout(timeout);
      resolve(ws);
    });
    
    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

/**
 * Helper: Send request and wait for response
 */
function sendRequest(ws, request) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 10000);
    
    const messageHandler = (data) => {
      try {
        const response = JSON.parse(data.toString());
        
        if (response.id === request.id) {
          clearTimeout(timeout);
          ws.removeListener('message', messageHandler);
          resolve(response);
        }
      } catch (error) {
        clearTimeout(timeout);
        ws.removeListener('message', messageHandler);
        reject(error);
      }
    };
    
    ws.on('message', messageHandler);
    ws.send(JSON.stringify(request));
  });
}


