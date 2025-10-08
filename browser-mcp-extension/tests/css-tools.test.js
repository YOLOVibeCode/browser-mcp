/**
 * CSS Tools Tests (TDD)
 * Pure JavaScript - Chrome Extension compatible
 */

import { createGetCSSStylesTool, createFindCSSRuleTool, createGetElementClassesTool } from '../background/tools/css-tools.js';
import { TabManager } from '../background/tab-manager.js';
import { ChromeCDP } from '../background/adapters/chrome-cdp.js';

const tests = [];
const test = (name, fn) => tests.push({ name, fn });
const assert = {
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

// Mock Chrome API
const mockChrome = {
  debugger: {
    attach: (target, version, callback) => { if (callback) callback(); },
    sendCommand: (target, method, params, callback) => {
      if (method === 'Runtime.evaluate') {
        // Mock CSS query results
        if (params.expression.includes('getComputedStyle')) {
          callback({ result: { value: { color: 'rgb(0, 0, 0)', fontSize: '16px' } } });
        } else if (params.expression.includes('classList')) {
          callback({ result: { value: ['btn', 'btn-primary', 'active'] } });
        } else {
          callback({ result: { value: [] } });
        }
      } else {
        callback({});
      }
    }
  },
  runtime: { lastError: null }
};

// TESTS

test('getCSSStyles tool should be created', () => {
  const tabManager = new TabManager();
  const cdp = new ChromeCDP(mockChrome);
  
  const tool = createGetCSSStylesTool(tabManager, cdp);
  
  assert.hasProperty(tool, 'name', 'Tool should have name');
  assert.hasProperty(tool, 'description', 'Tool should have description');
  assert.hasProperty(tool, 'inputSchema', 'Tool should have inputSchema');
  assert.hasProperty(tool, 'execute', 'Tool should have execute function');
  assert.isTrue(tool.name === 'getCSSStyles', 'Tool name should be getCSSStyles');
});

test('getCSSStyles tool should execute', async () => {
  const tabManager = new TabManager();
  const cdp = new ChromeCDP(mockChrome);
  tabManager.registerTab(123, 'http://localhost:3000');
  
  const tool = createGetCSSStylesTool(tabManager, cdp);
  
  const result = await tool.execute({
    selector: '.button'
  });
  
  assert.hasProperty(result, 'tabs', 'Result should have tabs');
  assert.isTrue(result.tabs.length > 0, 'Should have results');
});

test('findCSSRule tool should be created', () => {
  const tabManager = new TabManager();
  const cdp = new ChromeCDP(mockChrome);
  
  const tool = createFindCSSRuleTool(tabManager, cdp);
  
  assert.hasProperty(tool, 'name', 'Tool should have name');
  assert.isTrue(tool.name === 'findCSSRule', 'Tool name should be findCSSRule');
});

test('findCSSRule tool should execute', async () => {
  const tabManager = new TabManager();
  const cdp = new ChromeCDP(mockChrome);
  tabManager.registerTab(123, 'http://localhost:3000');
  
  const tool = createFindCSSRuleTool(tabManager, cdp);
  
  const result = await tool.execute({
    selector: '.button',
    property: 'color'
  });
  
  assert.hasProperty(result, 'tabs', 'Result should have tabs');
});

test('getElementClasses tool should be created', () => {
  const tabManager = new TabManager();
  const cdp = new ChromeCDP(mockChrome);
  
  const tool = createGetElementClassesTool(tabManager, cdp);
  
  assert.hasProperty(tool, 'name', 'Tool should have name');
  assert.isTrue(tool.name === 'getElementClasses', 'Tool name should be getElementClasses');
});

test('getElementClasses tool should execute', async () => {
  const tabManager = new TabManager();
  const cdp = new ChromeCDP(mockChrome);
  tabManager.registerTab(123, 'http://localhost:3000');
  
  const tool = createGetElementClassesTool(tabManager, cdp);
  
  const result = await tool.execute({
    selector: '.button'
  });
  
  assert.hasProperty(result, 'tabs', 'Result should have tabs');
});

// RUN TESTS
async function runTests() {
  console.log('Running CSS Tools tests...\n');
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

