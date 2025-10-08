/**
 * End-to-End Integration Tests
 * Tests full system: TabManager → ChromeCDP → MCP Server → Tools
 */

import { MCPServer } from '../background/mcp-server.js';
import { TabManager } from '../background/tab-manager.js';
import { ChromeCDP } from '../background/adapters/chrome-cdp.js';
import { createGetConsoleTool } from '../background/tools/console-tools.js';
import { createListTabsTool } from '../background/tools/tab-tools.js';
import { createEvaluateCodeTool } from '../background/tools/evaluate-tools.js';

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const assert = {
  equals: (actual, expected, msg) => {
    if (actual !== expected) {
      throw new Error(`${msg || 'Assertion failed'}: expected ${expected}, got ${actual}`);
    }
  },
  isTrue: (value, msg) => {
    if (!value) {
      throw new Error(`${msg || 'Assertion failed'}: expected true, got ${value}`);
    }
  },
  hasProperty: (obj, prop, msg) => {
    if (!obj || !obj.hasOwnProperty(prop)) {
      throw new Error(`${msg || 'Assertion failed'}: object missing property ${prop}`);
    }
  }
};

// Mock Chrome API for testing
const mockChrome = {
  debugger: {
    attach: (target, version, callback) => { if (callback) callback(); },
    sendCommand: (target, method, params, callback) => {
      if (method === 'Runtime.evaluate' && params.expression === 'document.title') {
        if (callback) callback({ result: { value: 'Test Page' } });
      } else {
        if (callback) callback({});
      }
    }
  },
  runtime: { lastError: null }
};

// E2E TESTS

test('E2E: Full system initialization', async () => {
  const mcpServer = new MCPServer();
  const tabManager = new TabManager();
  const cdp = new ChromeCDP(mockChrome);
  
  // Register tools
  mcpServer.registerTool(createListTabsTool(tabManager));
  
  // Add tabs
  tabManager.registerTab(123, 'http://localhost:3000');
  
  // Request via JSON-RPC
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  };
  
  const response = await mcpServer.handleRequest(request);
  
  assert.equals(response.jsonrpc, '2.0', 'Should be JSON-RPC 2.0');
  assert.hasProperty(response, 'result', 'Should have result');
  assert.isTrue(response.result.tools.length > 0, 'Should have tools registered');
});

test('E2E: listTabs tool execution', async () => {
  const mcpServer = new MCPServer();
  const tabManager = new TabManager();
  
  mcpServer.registerTool(createListTabsTool(tabManager));
  
  tabManager.registerTab(123, 'http://localhost:3000');
  tabManager.registerTab(456, 'http://example.com');
  
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'listTabs',
      arguments: {}
    }
  };
  
  const response = await mcpServer.handleRequest(request);
  
  assert.hasProperty(response, 'result', 'Should have result');
  assert.equals(response.result.totalCount, 2, 'Should have 2 tabs');
});

test('E2E: evaluateCode tool with CDP', async () => {
  const mcpServer = new MCPServer();
  const tabManager = new TabManager();
  const cdp = new ChromeCDP(mockChrome);
  
  mcpServer.registerTool(createEvaluateCodeTool(tabManager, cdp));
  
  tabManager.registerTab(123, 'http://localhost:3000');
  
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'evaluateCode',
      arguments: {
        expression: 'document.title'
      }
    }
  };
  
  const response = await mcpServer.handleRequest(request);
  
  assert.hasProperty(response, 'result', 'Should have result');
  assert.hasProperty(response.result, 'tabs', 'Should have tabs array');
  assert.isTrue(response.result.tabs.length > 0, 'Should have at least one tab result');
});

test('E2E: Error handling for unknown tool', async () => {
  const mcpServer = new MCPServer();
  
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'nonexistent_tool',
      arguments: {}
    }
  };
  
  const response = await mcpServer.handleRequest(request);
  
  assert.hasProperty(response, 'error', 'Should have error');
  assert.equals(response.error.code, -32602, 'Should be Invalid params error');
});

test('E2E: Multiple tools registered and callable', async () => {
  const mcpServer = new MCPServer();
  const tabManager = new TabManager();
  const cdp = new ChromeCDP(mockChrome);
  
  // Register multiple tools
  mcpServer.registerTool(createListTabsTool(tabManager));
  mcpServer.registerTool(createEvaluateCodeTool(tabManager, cdp));
  mcpServer.registerTool(createGetConsoleTool(tabManager, cdp));
  
  tabManager.registerTab(123, 'http://localhost:3000');
  
  // List tools
  let response = await mcpServer.handleRequest({
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  });
  
  assert.equals(response.result.tools.length, 3, 'Should have 3 tools');
  
  // Call each tool
  for (const tool of response.result.tools) {
    const toolResponse = await mcpServer.handleRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: tool.name,
        arguments: {}
      }
    });
    
    assert.hasProperty(toolResponse, 'result', `Tool ${tool.name} should return result`);
  }
});

// RUN TESTS
async function runTests() {
  console.log('Running E2E Integration tests...\n');
  let passed = 0;
  let failed = 0;

  for (const { name, fn } of tests) {
    try {
      await fn();
      console.log(`✓ ${name}`);
      passed++;
    } catch (error) {
      console.log(`✗ ${name}`);
      console.log(`  ${error.message}`);
      failed++;
    }
  }

  console.log(`\n${passed} passed, ${failed} failed`);
  return failed === 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then(success => process.exit(success ? 0 : 1));
}

export { runTests };

