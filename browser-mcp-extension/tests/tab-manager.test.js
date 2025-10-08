/**
 * TabManager Tests (TDD)
 * Pure JavaScript - Chrome Extension compatible
 */

import { TabManager } from '../background/tab-manager.js';

// Simple test runner
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
  }
};

// TESTS

test('TabManager should start with no tabs', () => {
  const manager = new TabManager();
  const tabs = manager.getAllTabs();
  assert.arrayLength(tabs, 0, 'Should have 0 tabs initially');
});

test('TabManager should register a tab', () => {
  const manager = new TabManager();
  manager.registerTab(123, 'http://localhost:3000');
  
  const tabs = manager.getAllTabs();
  assert.arrayLength(tabs, 1, 'Should have 1 tab');
  assert.equals(tabs[0].tabId, 123, 'Tab ID should match');
  assert.equals(tabs[0].url, 'http://localhost:3000', 'URL should match');
});

test('TabManager should unregister a tab', () => {
  const manager = new TabManager();
  manager.registerTab(123, 'http://localhost:3000');
  manager.unregisterTab(123);
  
  const tabs = manager.getAllTabs();
  assert.arrayLength(tabs, 0, 'Should have 0 tabs after unregister');
});

test('TabManager should find tabs by URL pattern', () => {
  const manager = new TabManager();
  manager.registerTab(123, 'http://localhost:3000/page1');
  manager.registerTab(456, 'http://localhost:3000/page2');
  manager.registerTab(789, 'http://example.com/page');
  
  const localhostTabs = manager.findTabs('localhost:3000');
  assert.arrayLength(localhostTabs, 2, 'Should find 2 localhost tabs');
  
  const exampleTabs = manager.findTabs('example.com');
  assert.arrayLength(exampleTabs, 1, 'Should find 1 example.com tab');
});

test('TabManager should return empty array when no tabs match', () => {
  const manager = new TabManager();
  manager.registerTab(123, 'http://localhost:3000');
  
  const tabs = manager.findTabs('nonexistent.com');
  assert.arrayLength(tabs, 0, 'Should return empty array');
});

test('TabManager should handle duplicate tab registrations', () => {
  const manager = new TabManager();
  manager.registerTab(123, 'http://localhost:3000/v1');
  manager.registerTab(123, 'http://localhost:3000/v2'); // Update
  
  const tabs = manager.getAllTabs();
  assert.arrayLength(tabs, 1, 'Should still have 1 tab');
  assert.equals(tabs[0].url, 'http://localhost:3000/v2', 'URL should be updated');
});

// RUN TESTS
async function runTests() {
  console.log('Running TabManager tests...\n');
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

// Export for use in other tests or run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests().then(success => process.exit(success ? 0 : 1));
}

export { runTests };

