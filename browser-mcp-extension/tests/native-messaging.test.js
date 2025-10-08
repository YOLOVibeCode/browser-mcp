/**
 * Native Messaging Tests (TDD)
 * Pure JavaScript - Chrome Extension compatible
 */

import { NativeMessaging } from '../background/adapters/native-messaging.js';

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
  },
  isFunction: (value, msg) => {
    if (typeof value !== 'function') {
      throw new Error(`${msg || 'Assertion failed'}: expected function, got ${typeof value}`);
    }
  }
};

// Mock chrome.runtime API for testing
const mockChrome = {
  runtime: {
    _nativePort: null,
    _messageHandler: null,
    _disconnectHandler: null,
    
    connectNative: function(hostName) {
      this._nativePort = {
        name: hostName,
        _messages: [],
        postMessage: function(message) {
          this._messages.push(message);
        },
        onMessage: {
          addListener: (handler) => {
            mockChrome.runtime._messageHandler = handler;
          }
        },
        onDisconnect: {
          addListener: (handler) => {
            mockChrome.runtime._disconnectHandler = handler;
          }
        },
        disconnect: function() {
          if (mockChrome.runtime._disconnectHandler) {
            mockChrome.runtime._disconnectHandler();
          }
        }
      };
      return this._nativePort;
    },
    
    // Test helpers
    _simulateMessage: function(message) {
      if (this._messageHandler) {
        this._messageHandler(message);
      }
    },
    
    _simulateDisconnect: function() {
      if (this._disconnectHandler) {
        this._disconnectHandler();
      }
    },
    
    _getMessages: function() {
      return this._nativePort ? this._nativePort._messages : [];
    },
    
    _reset: function() {
      this._nativePort = null;
      this._messageHandler = null;
      this._disconnectHandler = null;
    }
  }
};

// TESTS

test('NativeMessaging should start disconnected', () => {
  mockChrome.runtime._reset();
  const nm = new NativeMessaging(mockChrome);
  
  assert.isFalse(nm.isConnected(), 'Should not be connected initially');
});

test('NativeMessaging should connect to host', async () => {
  mockChrome.runtime._reset();
  const nm = new NativeMessaging(mockChrome);
  
  await nm.connect('com.browser_mcp.host');
  
  assert.isTrue(nm.isConnected(), 'Should be connected after connect()');
});

test('NativeMessaging should disconnect from host', async () => {
  mockChrome.runtime._reset();
  const nm = new NativeMessaging(mockChrome);
  
  await nm.connect('com.browser_mcp.host');
  await nm.disconnect();
  
  assert.isFalse(nm.isConnected(), 'Should be disconnected after disconnect()');
});

test('NativeMessaging should send message', async () => {
  mockChrome.runtime._reset();
  const nm = new NativeMessaging(mockChrome);
  
  await nm.connect('com.browser_mcp.host');
  await nm.sendMessage({ type: 'test', data: 'hello' });
  
  const messages = mockChrome.runtime._getMessages();
  assert.equals(messages.length, 1, 'Should have sent 1 message');
  assert.equals(messages[0].type, 'test', 'Message type should match');
});

test('NativeMessaging should receive messages', async () => {
  mockChrome.runtime._reset();
  const nm = new NativeMessaging(mockChrome);
  
  let receivedMessage = null;
  nm.onMessage((msg) => {
    receivedMessage = msg;
  });
  
  await nm.connect('com.browser_mcp.host');
  
  // Simulate incoming message
  mockChrome.runtime._simulateMessage({ type: 'response', data: 'world' });
  
  assert.isTrue(receivedMessage !== null, 'Should receive message');
  assert.equals(receivedMessage.type, 'response', 'Received message type should match');
});

test('NativeMessaging should handle disconnect', async () => {
  mockChrome.runtime._reset();
  const nm = new NativeMessaging(mockChrome);
  
  let disconnected = false;
  nm.onDisconnect(() => {
    disconnected = true;
  });
  
  await nm.connect('com.browser_mcp.host');
  
  // Simulate disconnect
  mockChrome.runtime._simulateDisconnect();
  
  assert.isTrue(disconnected, 'Should trigger disconnect callback');
  assert.isFalse(nm.isConnected(), 'Should be disconnected');
});

test('NativeMessaging should queue messages when disconnected', async () => {
  mockChrome.runtime._reset();
  const nm = new NativeMessaging(mockChrome);
  
  // Try to send before connecting
  await nm.sendMessage({ type: 'queued', data: 'test' });
  
  // Now connect
  await nm.connect('com.browser_mcp.host');
  
  const messages = mockChrome.runtime._getMessages();
  assert.equals(messages.length, 1, 'Queued message should be sent after connect');
  assert.equals(messages[0].type, 'queued', 'Message should match');
});

test('NativeMessaging should auto-reconnect on disconnect', async () => {
  mockChrome.runtime._reset();
  const nm = new NativeMessaging(mockChrome, { autoReconnect: true, reconnectDelay: 10 });
  
  await nm.connect('com.browser_mcp.host');
  
  // Simulate disconnect
  mockChrome.runtime._simulateDisconnect();
  
  // Wait for auto-reconnect
  await new Promise(resolve => setTimeout(resolve, 50));
  
  assert.isTrue(nm.isConnected(), 'Should auto-reconnect after disconnect');
});

// RUN TESTS
async function runTests() {
  console.log('Running Native Messaging tests...\n');
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

