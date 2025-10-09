#!/usr/bin/env node
/**
 * Direct WebSocket Test - Bypasses Playwright
 * Tests if WebSocket server is reachable on port 8765
 */

import WebSocket from 'ws';

const WS_URL = 'ws://localhost:8765';
const TIMEOUT = 5000;

console.log('==============================================');
console.log('Direct WebSocket Connection Test');
console.log('URL:', WS_URL);
console.log('==============================================\n');

console.log('PREREQUISITES:');
console.log('1. Load browser-mcp-extension in Chrome');
console.log('2. Check Chrome extension console for errors');
console.log('3. Verify extension service worker is running\n');

console.log('Testing connection...\n');

const ws = new WebSocket(WS_URL);
let connected = false;

const timeout = setTimeout(() => {
  if (!connected) {
    console.log('❌ CONNECTION TIMEOUT after', TIMEOUT, 'ms');
    console.log('\nPossible causes:');
    console.log('1. Extension not loaded in Chrome');
    console.log('2. Service worker not started');
    console.log('3. chrome.sockets API not available');
    console.log('4. WebSocket server failed to start');
    console.log('\nNext steps:');
    console.log('- Open Chrome and load the extension');
    console.log('- Open chrome://extensions and check for errors');
    console.log('- Check service worker console logs');
    ws.close();
    process.exit(1);
  }
}, TIMEOUT);

ws.on('open', () => {
  clearTimeout(timeout);
  connected = true;
  console.log('✅ CONNECTION SUCCESSFUL!\n');
  
  // Send tools/list request
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list',
    params: {}
  };
  
  console.log('Sending tools/list request...');
  ws.send(JSON.stringify(request));
});

ws.on('message', (data) => {
  try {
    const response = JSON.parse(data.toString());
    console.log('✅ RESPONSE RECEIVED!\n');
    console.log('Response ID:', response.id);
    console.log('Tools count:', response.result?.tools?.length || 0);
    
    if (response.result?.tools) {
      console.log('\nFirst 5 tools:');
      response.result.tools.slice(0, 5).forEach((tool, i) => {
        console.log(`  ${i + 1}. ${tool.name}`);
      });
    }
    
    console.log('\n✅ WebSocket server is WORKING!\n');
    ws.close();
    process.exit(0);
  } catch (err) {
    console.log('❌ Failed to parse response:', err.message);
    ws.close();
    process.exit(1);
  }
});

ws.on('error', (error) => {
  clearTimeout(timeout);
  console.log('❌ CONNECTION ERROR:', error.message);
  console.log('\nThis usually means:');
  console.log('- WebSocket server is not running on port 8765');
  console.log('- Chrome extension is not loaded');
  console.log('- Service worker failed to start WebSocket server');
  process.exit(1);
});

ws.on('close', () => {
  if (!connected) {
    console.log('❌ Connection closed before establishing');
  }
});

