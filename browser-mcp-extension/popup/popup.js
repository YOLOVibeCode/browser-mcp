/**
 * Browser MCP v3.0 - Popup UI Logic
 * Pure JavaScript - Chrome Extension compatible
 */

// DOM elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const statusMessage = document.getElementById('statusMessage');
const tabCount = document.getElementById('tabCount');
const toolCount = document.getElementById('toolCount');
const tabsContent = document.getElementById('tabsContent');
const refreshBtn = document.getElementById('refreshBtn');
const testBtn = document.getElementById('testBtn');

/**
 * Update UI with current status
 */
async function updateStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_STATUS' });
    
    // Update status indicator
    if (response.connected) {
      statusIndicator.className = 'status-indicator connected';
      statusText.textContent = 'Connected';
      statusMessage.textContent = 'IDE connected via native messaging';
    } else {
      statusIndicator.className = 'status-indicator disconnected';
      statusText.textContent = 'Extension Active';
      statusMessage.textContent = 'Native host not connected';
    }
    
    // Update counts
    tabCount.textContent = response.tabCount || 0;
    toolCount.textContent = response.toolCount || 0;
    
    // Update tabs list
    if (response.tabs && response.tabs.length > 0) {
      tabsContent.innerHTML = response.tabs
        .map(tab => `<div class="tab-item">${tab.url}</div>`)
        .join('');
    } else {
      tabsContent.innerHTML = '<div style="color: #999;">No tabs tracked yet</div>';
    }
    
  } catch (error) {
    console.error('Failed to get status:', error);
    statusIndicator.className = 'status-indicator error';
    statusText.textContent = 'Error';
    statusMessage.textContent = error.message;
  }
}

/**
 * Test connection by calling a tool
 */
async function testConnection() {
  try {
    testBtn.disabled = true;
    testBtn.textContent = 'Testing...';
    
    const response = await chrome.runtime.sendMessage({
      type: 'TEST_TOOL',
      method: 'tools/list',
      params: {}
    });
    
    if (response.result) {
      alert(`✓ Connection test successful!\n\nFound ${response.result.tools.length} tools:\n${response.result.tools.map(t => `- ${t.name}`).join('\n')}`);
    } else if (response.error) {
      alert(`✗ Connection test failed:\n${response.error.message}`);
    }
    
  } catch (error) {
    alert(`✗ Connection test failed:\n${error.message}`);
  } finally {
    testBtn.disabled = false;
    testBtn.textContent = 'Test Connection';
  }
}

// Event listeners
refreshBtn.addEventListener('click', updateStatus);
testBtn.addEventListener('click', testConnection);

// Initial update
updateStatus();

// Auto-refresh every 5 seconds
setInterval(updateStatus, 5000);

console.log('[Browser MCP] Popup loaded');

