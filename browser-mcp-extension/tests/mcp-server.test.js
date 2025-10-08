/**
 * MCPServer Tests (TDD)
 * Pure JavaScript - Chrome Extension compatible
 */

import { MCPServer } from '../background/mcp-server.js';

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
  arrayLength: (arr, length, msg) => {
    if (arr.length !== length) {
      throw new Error(`${msg || 'Assertion failed'}: expected length ${length}, got ${arr.length}`);
    }
  },
  hasProperty: (obj, prop, msg) => {
    if (!obj.hasOwnProperty(prop)) {
      throw new Error(`${msg || 'Assertion failed'}: object missing property ${prop}`);
    }
  }
};

// Mock tool for testing
const mockTool = {
  name: 'test_tool',
  description: 'A test tool',
  inputSchema: {
    type: 'object',
    properties: {
      input: { type: 'string' }
    }
  },
  execute: async (params) => {
    return { result: `Executed with: ${params.input}` };
  }
};

// TESTS

test('MCPServer should start with no tools', async () => {
  const server = new MCPServer();
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  };
  
  const response = await server.handleRequest(request);
  assert.hasProperty(response, 'result', 'Should have result property');
  assert.arrayLength(response.result.tools, 0, 'Should have 0 tools');
});

test('MCPServer should register a tool', async () => {
  const server = new MCPServer();
  server.registerTool(mockTool);
  
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  };
  
  const response = await server.handleRequest(request);
  assert.arrayLength(response.result.tools, 1, 'Should have 1 tool');
  assert.equals(response.result.tools[0].name, 'test_tool', 'Tool name should match');
});

test('MCPServer should handle initialize request', () => {
  const server = new MCPServer();
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'test-client', version: '1.0.0' }
    }
  };
  
  const response = server.handleRequest(request);
  assert.equals(response.jsonrpc, '2.0', 'Should be JSON-RPC 2.0');
  assert.equals(response.id, 1, 'ID should match request');
  assert.hasProperty(response.result, 'serverInfo', 'Should have serverInfo');
  assert.equals(response.result.serverInfo.name, 'browser-mcp', 'Server name should be browser-mcp');
});

test('MCPServer should call tool', async () => {
  const server = new MCPServer();
  server.registerTool(mockTool);
  
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'test_tool',
      arguments: { input: 'hello' }
    }
  };
  
  const response = await server.handleRequest(request);
  assert.hasProperty(response, 'result', 'Should have result');
  assert.equals(response.result.result, 'Executed with: hello', 'Tool should be executed');
});

test('MCPServer should return error for unknown tool', async () => {
  const server = new MCPServer();
  
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/call',
    params: {
      name: 'nonexistent_tool',
      arguments: {}
    }
  };
  
  const response = await server.handleRequest(request);
  assert.hasProperty(response, 'error', 'Should have error');
  assert.equals(response.error.code, -32602, 'Should be Invalid params error');
});

test('MCPServer should return error for unknown method', async () => {
  const server = new MCPServer();
  
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'unknown/method'
  };
  
  const response = await server.handleRequest(request);
  assert.hasProperty(response, 'error', 'Should have error');
  assert.equals(response.error.code, -32601, 'Should be Method not found error');
});

test('MCPServer should handle malformed request', async () => {
  const server = new MCPServer();
  
  const request = {
    // Missing jsonrpc and id
    method: 'tools/list'
  };
  
  const response = await server.handleRequest(request);
  assert.hasProperty(response, 'error', 'Should have error');
  assert.equals(response.error.code, -32600, 'Should be Invalid Request error');
});

// RUN TESTS
async function runTests() {
  console.log('Running MCPServer tests...\n');
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

