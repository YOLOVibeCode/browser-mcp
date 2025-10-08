/**
 * ChromeCDP Tests (TDD)
 * Pure JavaScript - Chrome Extension compatible
 */

import { ChromeCDP } from '../background/adapters/chrome-cdp.js';

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
  isFalse: (value, msg) => {
    if (value) {
      throw new Error(`${msg || 'Assertion failed'}: expected false, got ${value}`);
    }
  }
};

// Mock chrome.debugger API for testing
const mockChrome = {
  debugger: {
    _attached: new Set(),
    _commandResults: new Map(),
    
    attach: function(target, version, callback) {
      this._attached.add(target.tabId);
      if (callback) callback();
      return Promise.resolve();
    },
    
    detach: function(target, callback) {
      this._attached.delete(target.tabId);
      if (callback) callback();
      return Promise.resolve();
    },
    
    sendCommand: function(target, method, params, callback) {
      const result = this._commandResults.get(`${target.tabId}:${method}`) || { success: true };
      if (callback) callback(result);
      return Promise.resolve(result);
    },
    
    _setCommandResult: function(tabId, method, result) {
      this._commandResults.set(`${tabId}:${method}`, result);
    },
    
    _reset: function() {
      this._attached.clear();
      this._commandResults.clear();
    }
  },
  
  runtime: {
    lastError: null
  }
};

// TESTS

test('ChromeCDP should start with no attachments', () => {
  mockChrome.debugger._reset();
  const cdp = new ChromeCDP(mockChrome);
  
  assert.isFalse(cdp.isAttached(123), 'Should not be attached initially');
});

test('ChromeCDP should attach debugger to tab', async () => {
  mockChrome.debugger._reset();
  const cdp = new ChromeCDP(mockChrome);
  
  await cdp.attach(123);
  
  assert.isTrue(cdp.isAttached(123), 'Should be attached after attach()');
});

test('ChromeCDP should detach debugger from tab', async () => {
  mockChrome.debugger._reset();
  const cdp = new ChromeCDP(mockChrome);
  
  await cdp.attach(123);
  await cdp.detach(123);
  
  assert.isFalse(cdp.isAttached(123), 'Should not be attached after detach()');
});

test('ChromeCDP should send CDP command', async () => {
  mockChrome.debugger._reset();
  mockChrome.debugger._setCommandResult(123, 'Runtime.evaluate', { 
    result: { value: 42 } 
  });
  
  const cdp = new ChromeCDP(mockChrome);
  await cdp.attach(123);
  
  const result = await cdp.sendCommand(123, 'Runtime.evaluate', { 
    expression: '6 * 7' 
  });
  
  assert.equals(result.result.value, 42, 'Should return command result');
});

test('ChromeCDP should handle multiple tabs', async () => {
  mockChrome.debugger._reset();
  const cdp = new ChromeCDP(mockChrome);
  
  await cdp.attach(123);
  await cdp.attach(456);
  
  assert.isTrue(cdp.isAttached(123), 'Tab 123 should be attached');
  assert.isTrue(cdp.isAttached(456), 'Tab 456 should be attached');
  
  await cdp.detach(123);
  
  assert.isFalse(cdp.isAttached(123), 'Tab 123 should be detached');
  assert.isTrue(cdp.isAttached(456), 'Tab 456 should still be attached');
});

test('ChromeCDP should auto-attach on sendCommand if not attached', async () => {
  mockChrome.debugger._reset();
  const cdp = new ChromeCDP(mockChrome);
  
  mockChrome.debugger._setCommandResult(123, 'Runtime.evaluate', { result: { value: 'test' } });
  
  assert.isFalse(cdp.isAttached(123), 'Should not be attached initially');
  
  const result = await cdp.sendCommand(123, 'Runtime.evaluate', { expression: '1+1' });
  
  assert.isTrue(cdp.isAttached(123), 'Should be auto-attached after sendCommand');
  assert.equals(result.result.value, 'test', 'Should return result');
});

// RUN TESTS
async function runTests() {
  console.log('Running ChromeCDP tests...\n');
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

