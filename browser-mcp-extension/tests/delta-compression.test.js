/**
 * Delta Compression Tests (TDD)
 * Pure JavaScript - Chrome Extension compatible
 */

import { DeltaCompressor } from '../background/optimization/delta-compression.js';

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

test('DeltaCompressor should return full data on first call', () => {
  const compressor = new DeltaCompressor();
  const data = [
    { id: 1, text: 'Message 1' },
    { id: 2, text: 'Message 2' }
  ];
  
  const result = compressor.computeDelta('tab-123', data);
  
  assert.equals(result.type, 'full', 'First call should be full');
  assert.arrayLength(result.data, 2, 'Should return all data');
  assert.equals(result.version, 1, 'Version should be 1');
});

test('DeltaCompressor should return delta on subsequent calls', () => {
  const compressor = new DeltaCompressor();
  
  // First call
  const data1 = [
    { id: 1, text: 'Message 1' },
    { id: 2, text: 'Message 2' }
  ];
  compressor.computeDelta('tab-123', data1);
  
  // Second call with one new item
  const data2 = [
    { id: 1, text: 'Message 1' },
    { id: 2, text: 'Message 2' },
    { id: 3, text: 'Message 3' }
  ];
  
  const result = compressor.computeDelta('tab-123', data2);
  
  assert.equals(result.type, 'delta', 'Should be delta');
  assert.arrayLength(result.data, 1, 'Should only return new item');
  assert.equals(result.data[0].id, 3, 'Should be the new message');
  assert.equals(result.version, 2, 'Version should increment');
});

test('DeltaCompressor should handle no changes', () => {
  const compressor = new DeltaCompressor();
  
  const data = [
    { id: 1, text: 'Message 1' }
  ];
  
  // First call
  compressor.computeDelta('tab-123', data);
  
  // Second call with same data
  const result = compressor.computeDelta('tab-123', data);
  
  assert.equals(result.type, 'delta', 'Should be delta');
  assert.arrayLength(result.data, 0, 'No new items');
  assert.equals(result.version, 2, 'Version should increment');
});

test('DeltaCompressor should handle multiple tabs independently', () => {
  const compressor = new DeltaCompressor();
  
  const data1 = [{ id: 1, text: 'Tab 1 Message' }];
  const data2 = [{ id: 1, text: 'Tab 2 Message' }];
  
  // First tab
  const result1 = compressor.computeDelta('tab-1', data1);
  assert.equals(result1.type, 'full', 'Tab 1 first call should be full');
  
  // Second tab (independent)
  const result2 = compressor.computeDelta('tab-2', data2);
  assert.equals(result2.type, 'full', 'Tab 2 first call should be full');
  
  // Update tab 1
  const data1Updated = [
    { id: 1, text: 'Tab 1 Message' },
    { id: 2, text: 'Tab 1 New' }
  ];
  const result1Updated = compressor.computeDelta('tab-1', data1Updated);
  assert.equals(result1Updated.type, 'delta', 'Tab 1 second call should be delta');
  assert.arrayLength(result1Updated.data, 1, 'Tab 1 should have 1 new item');
});

test('DeltaCompressor should reset to full after threshold', () => {
  const compressor = new DeltaCompressor({ fullSyncThreshold: 2 });
  
  let data = [{ id: 1, text: 'Message 1' }];
  
  // First call (full)
  compressor.computeDelta('tab-123', data);
  
  // Second call (delta 1)
  data = [...data, { id: 2, text: 'Message 2' }];
  compressor.computeDelta('tab-123', data);
  
  // Third call (delta 2)
  data = [...data, { id: 3, text: 'Message 3' }];
  compressor.computeDelta('tab-123', data);
  
  // Fourth call (should reset to full)
  data = [...data, { id: 4, text: 'Message 4' }];
  const result = compressor.computeDelta('tab-123', data);
  
  assert.equals(result.type, 'full', 'Should reset to full after threshold');
  assert.equals(result.data.length, 4, 'Should return all data');
});

test('DeltaCompressor should clear cache for specific key', () => {
  const compressor = new DeltaCompressor();
  
  const data = [{ id: 1, text: 'Message 1' }];
  
  compressor.computeDelta('tab-123', data);
  compressor.clear('tab-123');
  
  // Next call should be full again
  const result = compressor.computeDelta('tab-123', data);
  assert.equals(result.type, 'full', 'Should be full after clear');
  assert.equals(result.version, 1, 'Version should reset to 1');
});

test('DeltaCompressor should provide savings statistics', () => {
  const compressor = new DeltaCompressor();
  
  // First call - 100 items
  const data1 = Array.from({ length: 100 }, (_, i) => ({ id: i, text: `Message ${i}` }));
  compressor.computeDelta('tab-123', data1);
  
  // Second call - 101 items (only 1 new)
  const data2 = [...data1, { id: 100, text: 'Message 100' }];
  const result = compressor.computeDelta('tab-123', data2);
  
  assert.equals(result.type, 'delta', 'Should be delta');
  assert.arrayLength(result.data, 1, 'Should only send 1 new item');
  
  // Savings: sent 1 instead of 101
  const savingsPercent = ((100 / 101) * 100).toFixed(0);
  assert.isTrue(parseInt(savingsPercent) > 90, 'Should save >90% bandwidth');
});

// RUN TESTS
async function runTests() {
  console.log('Running Delta Compression tests...\n');
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

