/**
 * Message Filter Tests (TDD)
 * Pure JavaScript - Chrome Extension compatible
 */

import { MessageFilter } from '../background/optimization/message-filter.js';

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
  isNull: (value, msg) => {
    if (value !== null) {
      throw new Error(`${msg || 'Assertion failed'}: expected null, got ${value}`);
    }
  }
};

// TESTS

test('MessageFilter should pass through normal messages', () => {
  const filter = new MessageFilter();
  const message = {
    type: 'log',
    text: 'User action completed',
    timestamp: Date.now()
  };
  
  const filtered = filter.filter(message);
  assert.isTrue(filtered !== null, 'Normal message should pass');
  assert.equals(filtered.text, message.text, 'Message should be unchanged');
});

test('MessageFilter should filter out HMR messages', () => {
  const filter = new MessageFilter();
  const message = {
    type: 'log',
    text: '[HMR] Hot Module Replacement',
    timestamp: Date.now()
  };
  
  const filtered = filter.filter(message);
  assert.isNull(filtered, 'HMR message should be filtered');
});

test('MessageFilter should filter webpack noise', () => {
  const filter = new MessageFilter();
  const messages = [
    { type: 'log', text: 'webpack compiled' },
    { type: 'log', text: 'webpack-dev-server' },
    { type: 'log', text: '[webpack] Building...' }
  ];
  
  for (const msg of messages) {
    const filtered = filter.filter(msg);
    assert.isNull(filtered, `Webpack message "${msg.text}" should be filtered`);
  }
});

test('MessageFilter should filter Vite noise', () => {
  const filter = new MessageFilter();
  const messages = [
    { type: 'log', text: '[vite] connected' },
    { type: 'log', text: '[vite] page reload' }
  ];
  
  for (const msg of messages) {
    const filtered = filter.filter(msg);
    assert.isNull(filtered, `Vite message should be filtered`);
  }
});

test('MessageFilter should filter image/font requests', () => {
  const filter = new MessageFilter();
  const requests = [
    { type: 'network', url: 'https://example.com/image.png', method: 'GET' },
    { type: 'network', url: 'https://example.com/font.woff2', method: 'GET' },
    { type: 'network', url: 'https://example.com/style.css', method: 'GET' }
  ];
  
  for (const req of requests) {
    const filtered = filter.filter(req);
    assert.isNull(filtered, `Resource ${req.url} should be filtered`);
  }
});

test('MessageFilter should NOT filter errors', () => {
  const filter = new MessageFilter();
  const message = {
    type: 'error',
    text: '[HMR] This is an error, should NOT be filtered',
    timestamp: Date.now()
  };
  
  const filtered = filter.filter(message);
  assert.isTrue(filtered !== null, 'Error messages should NEVER be filtered');
});

test('MessageFilter should NOT filter warnings', () => {
  const filter = new MessageFilter();
  const message = {
    type: 'warning',
    text: 'webpack deprecated API',
    timestamp: Date.now()
  };
  
  const filtered = filter.filter(message);
  assert.isTrue(filtered !== null, 'Warning messages should NEVER be filtered');
});

test('MessageFilter should allow custom patterns', () => {
  const filter = new MessageFilter({
    ignorePatterns: ['CUSTOM_NOISE', 'TEST_MESSAGE']
  });
  
  const message1 = { type: 'log', text: 'CUSTOM_NOISE detected' };
  const message2 = { type: 'log', text: 'Normal message' };
  
  assert.isNull(filter.filter(message1), 'Custom pattern should be filtered');
  assert.isTrue(filter.filter(message2) !== null, 'Normal message should pass');
});

test('MessageFilter should track filter statistics', () => {
  const filter = new MessageFilter();
  
  filter.filter({ type: 'log', text: '[HMR] test' });
  filter.filter({ type: 'log', text: 'Normal message' });
  filter.filter({ type: 'log', text: 'webpack compiled successfully' });
  
  const stats = filter.getStats();
  assert.equals(stats.total, 3, 'Should track total messages');
  assert.equals(stats.filtered, 2, 'Should track filtered count');
  assert.equals(stats.passed, 1, 'Should track passed count');
});

// RUN TESTS
async function runTests() {
  console.log('Running Message Filter tests...\n');
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

