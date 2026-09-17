#!/usr/bin/env node

/**
 * Quick WebSocket Connection Test
 * Tests if MCP server is responding to tools/list requests
 */

const WebSocket = require('ws');

console.log('Testing WebSocket connection to ws://localhost:8765...\n');

const ws = new WebSocket('ws://localhost:8765');
let connected = false;
let received = false;

// Timeout after 5 seconds
const timeout = setTimeout(() => {
  if (!connected) {
    console.log('❌ Connection timeout - server may not be running');
    process.exit(1);
  } else if (!received) {
    console.log('❌ Response timeout - extension may not be connected');
    process.exit(1);
  }
}, 5000);

ws.on('open', () => {
  connected = true;
  console.log('✅ WebSocket connected\n');
  console.log('Sending tools/list request...');
  
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  };
  
  ws.send(JSON.stringify(request));
});

ws.on('message', (data) => {
  received = true;
  clearTimeout(timeout);
  
  try {
    const response = JSON.parse(data.toString());
    console.log('\n✅ Received response\n');
    
    if (response.result && response.result.tools) {
      const toolCount = response.result.tools.length;
      console.log(`📊 Tools available: ${toolCount}`);
      
      if (toolCount === 33) {
        console.log('✅ All 33 tools present!\n');
        console.log('First few tools:');
        response.result.tools.slice(0, 5).forEach(tool => {
          console.log(`  • ${tool.name}: ${tool.description.substring(0, 60)}...`);
        });
      } else if (toolCount === 1 && response.result.tools[0].name === 'browser-mcp-setup-instructions') {
        console.log('⚠️  Extension not connected yet');
        console.log('    Load extension in Chrome: chrome://extensions/\n');
        process.exit(1);
      } else {
        console.log(`⚠️  Expected 33 tools, found ${toolCount}\n`);
      }
    } else if (response.error) {
      console.log('❌ Error response:', response.error.message);
      if (response.error.data) {
        console.log('   Data:', response.error.data);
      }
      process.exit(1);
    }
    
  } catch (error) {
    console.log('❌ Failed to parse response:', error.message);
    console.log('   Raw data:', data.toString().substring(0, 200));
    process.exit(1);
  }
  
  ws.close();
  console.log('\n✅ MCP Server is working correctly!');
  process.exit(0);
});

ws.on('error', (error) => {
  console.log('❌ WebSocket error:', error.message);
  if (error.code === 'ECONNREFUSED') {
    console.log('   Server is not running on port 8765');
    console.log('   Start with: node mcp-server/index.js');
  }
  process.exit(1);
});

ws.on('close', () => {
  if (!received) {
    console.log('❌ Connection closed before receiving response');
    process.exit(1);
  }
});

