/**
 * Browser MCP v4.0 - Popup Interface
 * WebSocket-based architecture
 */

// Load version from manifest.json (single source of truth)
const manifest = chrome.runtime.getManifest();
const VERSION = manifest.version;

// Update version display immediately
document.addEventListener('DOMContentLoaded', () => {
  const versionDisplay = document.getElementById('version-display');
  if (versionDisplay) {
    versionDisplay.textContent = `Version ${VERSION} • WebSocket Architecture`;
  }
});

// Status elements
const serverStatus = document.getElementById('server-status');
const serverText = document.getElementById('server-text');
const serverIndicator = document.getElementById('server-indicator');
const wsText = document.getElementById('ws-text');
const wsIndicator = document.getElementById('ws-indicator');
const toolsCount = document.getElementById('tools-count');
const infoMessage = document.getElementById('info-message');
const testBtn = document.getElementById('test-btn');
const reconnectBtn = document.getElementById('reconnect-btn');

// Update status
function updateStatus(status) {
  console.log('[Popup] Status update:', status);

  // Update WebSocket status
  if (status.websocket) {
    wsText.textContent = status.websocket.connected ? 'Connected' : 'Disconnected';
    wsIndicator.className = 'status-indicator ' + (status.websocket.connected ? 'status-connected' : 'status-disconnected');
  }

  // Update server status
  if (status.server) {
    if (status.server.running) {
      serverText.textContent = 'Connected';
      serverIndicator.className = 'status-indicator status-connected';
      serverIndicator.classList.remove('pulse');
    } else {
      serverText.textContent = 'Not Running';
      serverIndicator.className = 'status-indicator status-disconnected';
      serverIndicator.classList.remove('pulse');
    }
  }

  // Update tools count
  if (status.tools !== undefined) {
    toolsCount.textContent = status.tools;

    if (status.tools === 33) {
      infoMessage.innerHTML = '<strong>✅ Everything is working!</strong>You can now use Claude Desktop, Cursor, or Windsurf to interact with your browser through 33 powerful tools.';
      infoMessage.style.display = 'block';
      reconnectBtn.style.display = 'none';
    } else if (status.tools === 0) {
      infoMessage.innerHTML = '<strong>⏳ Waiting for MCP Server...</strong>The extension is ready, but the MCP server needs to be running. Start your IDE (Claude Desktop, Cursor, or Windsurf) and the server will launch automatically.';
      infoMessage.style.display = 'block';
      reconnectBtn.style.display = 'block';
    }
  }
}

// Check status
function checkStatus() {
  console.log('[Popup] Checking status...');

  chrome.runtime.sendMessage({ type: 'getStatus' }, (response) => {
    if (chrome.runtime.lastError) {
      console.error('[Popup] Error getting status:', chrome.runtime.lastError);
      updateStatus({
        websocket: { connected: false },
        server: { running: false },
        tools: 0
      });
      return;
    }

    console.log('[Popup] Received status:', response);
    updateStatus(response);
  });
}

// Test connection
testBtn.addEventListener('click', () => {
  console.log('[Popup] Testing connection...');
  testBtn.textContent = 'Testing...';
  testBtn.disabled = true;

  chrome.runtime.sendMessage({ type: 'testConnection' }, (response) => {
    testBtn.textContent = 'Test Connection';
    testBtn.disabled = false;

    if (chrome.runtime.lastError) {
      alert('❌ Test failed: ' + chrome.runtime.lastError.message);
      return;
    }

    if (response && response.success) {
      alert('✅ Connection test successful!\n\n' +
            'Extension: Connected\n' +
            'WebSocket: Connected\n' +
            'MCP Server: Running\n' +
            'Tools: ' + (response.tools || 0) + ' available');
    } else {
      alert('⚠️ Connection test failed\n\n' +
            'The extension is running but cannot connect to the MCP server.\n\n' +
            'Make sure your IDE (Claude Desktop, Cursor, or Windsurf) is running.');
    }

    checkStatus();
  });
});

// Reconnect
reconnectBtn.addEventListener('click', () => {
  console.log('[Popup] Reconnecting...');
  reconnectBtn.textContent = 'Reconnecting...';
  reconnectBtn.disabled = true;

  chrome.runtime.sendMessage({ type: 'reconnect' }, () => {
    reconnectBtn.textContent = 'Reconnect to Server';
    reconnectBtn.disabled = false;

    setTimeout(checkStatus, 1000);
  });
});

// Listen for status updates from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'statusUpdate') {
    console.log('[Popup] Status update from background:', message.status);
    updateStatus(message.status);
  }
});

// Check status on load and every 2 seconds
checkStatus();
setInterval(checkStatus, 2000);
