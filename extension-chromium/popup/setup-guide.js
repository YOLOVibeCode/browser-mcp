/**
 * Setup Guide - Step-by-step connection flow
 */

let serverRunning = false;
let tabConnected = false;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Setup guide loaded');

  // Start checking for server
  await checkServerStatus();
  setInterval(checkServerStatus, 3000);

  // Setup event listeners
  document.getElementById('connectTabBtn').addEventListener('click', connectTab);
  document.getElementById('openMainPopupBtn').addEventListener('click', openMainPopup);
  document.getElementById('downloadCompanionBtn').addEventListener('click', downloadCompanion);
});

/**
 * Check if MCP server is running
 */
async function checkServerStatus() {
  try {
    // Try to connect to default MCP server port
    const response = await fetch('http://localhost:3100/health', {
      method: 'GET',
      signal: AbortSignal.timeout(2000)
    }).catch(() => null);

    if (response && response.ok) {
      serverRunning = true;
      updateStep1Status('ready');
      enableStep2();
    } else {
      serverRunning = false;
      updateStep1Status('not-ready');
      disableStep2();
    }
  } catch (err) {
    console.log('Server check failed:', err);
    serverRunning = false;
    updateStep1Status('not-ready');
    disableStep2();
  }
}

/**
 * Update Step 1 status
 */
function updateStep1Status(status) {
  const step1 = document.getElementById('step1');
  const statusEl = document.getElementById('step1Status');
  const notReadyEl = document.getElementById('step1NotReady');
  const readyEl = document.getElementById('step1Ready');

  if (status === 'ready') {
    step1.classList.add('complete');
    step1.classList.remove('active', 'error');
    statusEl.className = 'status-indicator ready';
    statusEl.innerHTML = '✓ Ready';
    notReadyEl.style.display = 'none';
    readyEl.style.display = 'block';
  } else if (status === 'not-ready') {
    step1.classList.add('active', 'error');
    step1.classList.remove('complete');
    statusEl.className = 'status-indicator not-ready';
    statusEl.innerHTML = '✕ Not Running';
    notReadyEl.style.display = 'block';
    readyEl.style.display = 'none';
  }
}

/**
 * Enable Step 2
 */
function enableStep2() {
  const step2 = document.getElementById('step2');
  const connectBtn = document.getElementById('connectTabBtn');

  step2.classList.add('active');
  connectBtn.disabled = false;
}

/**
 * Disable Step 2
 */
function disableStep2() {
  const step2 = document.getElementById('step2');
  const connectBtn = document.getElementById('connectTabBtn');

  step2.classList.remove('active', 'complete');
  connectBtn.disabled = true;
}

/**
 * Connect current tab
 */
async function connectTab() {
  const step2 = document.getElementById('step2');
  const statusEl = document.getElementById('step2Status');
  const connectBtn = document.getElementById('connectTabBtn');
  const completeEl = document.getElementById('step2Complete');

  try {
    // Show connecting status
    statusEl.style.display = 'flex';
    connectBtn.disabled = true;

    // Get current tab
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentTab = tabs[0];

    // Send message to background to activate tab
    const response = await chrome.runtime.sendMessage({
      type: 'ACTIVATE_TAB',
      payload: {
        tabId: currentTab.id,
        url: currentTab.url
      }
    });

    if (response.success) {
      // Success!
      tabConnected = true;
      step2.classList.add('complete');
      step2.classList.remove('active');
      statusEl.style.display = 'none';

      // Show completion details
      completeEl.style.display = 'block';
      document.getElementById('allocatedPort').textContent = response.data.port || '3100';

      // Show "All Done" section
      document.getElementById('allDone').style.display = 'block';
    } else {
      throw new Error(response.error || 'Connection failed');
    }
  } catch (err) {
    console.error('Error connecting tab:', err);

    // Show error
    step2.classList.add('error');
    statusEl.className = 'status-indicator not-ready';
    statusEl.innerHTML = '✕ Failed';
    statusEl.style.display = 'flex';

    alert('Failed to connect: ' + err.message + '\n\nMake sure the MCP server is running.');

    // Re-enable button
    connectBtn.disabled = false;
  }
}

/**
 * Open main popup
 */
function openMainPopup() {
  window.location.href = 'test-popup.html';
}

/**
 * Download companion app
 */
function downloadCompanion() {
  alert('Companion app coming soon!\n\nFor now, please run:\n\ncd browser-mcp\nnpm run server:start');
}
