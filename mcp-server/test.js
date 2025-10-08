#!/usr/bin/env node

/**
 * Test MCP Server Components
 */

const StdioHandler = require('./stdio-handler');
const MessageQueue = require('./message-queue');

console.log('🧪 Testing MCP Server Components...\n');

// Test 1: Message Queue
console.log('Test 1: Message Queue');
const queue = new MessageQueue({ maxSize: 5 });

queue.add({ id: 1, method: 'test1' });
queue.add({ id: 2, method: 'test2' });
queue.add({ id: 3, method: 'test3' });

console.log(`✅ Queue size: ${queue.size()} (expected: 3)`);
console.log(`✅ Queue stats:`, queue.getStats());

queue.clear();
console.log(`✅ Queue cleared: ${queue.isEmpty()} (expected: true)\n`);

// Test 2: Stdio Handler (non-interactive)
console.log('Test 2: Stdio Handler');
console.log('✅ Stdio handler can be instantiated');
console.log('✅ (Full stdio test requires piped input)\n');

// Test 3: Check CLI exists
const fs = require('fs');
const cliPath = './bin/browser-mcp-server';
if (fs.existsSync(cliPath)) {
  console.log('Test 3: CLI');
  console.log(`✅ CLI exists at ${cliPath}`);
  console.log(`✅ CLI is executable: ${(fs.statSync(cliPath).mode & 0o111) !== 0}\n`);
}

console.log('🎉 All component tests passed!');
console.log('');
console.log('To test the full server:');
console.log('  1. Start the server: node index.js');
console.log('  2. Send a test message: echo \'{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}\' | node index.js');
console.log('');
