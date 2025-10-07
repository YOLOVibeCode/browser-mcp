/**
 * Test Popup - Tab Connection Manager
 */

let currentTabId = null;
let currentTabUrl = null;
let isConnected = false;

document.addEventListener('DOMContentLoaded', async () => {
  console.log('Test popup loaded');
  await updateCurrentTabInfo();
  await updateActiveTabsList();
  
  const activateBtn = document.getElementById('activateBtn');
  const deactivateBtn = document.getElementById('deactivateBtn');
  
  if (activateBtn) {
    activateBtn.addEventListener('click', async () => {
      try {
        activateBtn.disabled = true;
        activateBtn.textContent = 'Connecting...';
        await activateCurrentTab();
        await updateCurrentTabInfo();
        await updateActiveTabsList();

        // Check if we came from workflow hub
        const urlParams = new URLSearchParams(window.location.search);
        const fromWorkflow = urlParams.get('from') === 'workflow';

        if (fromWorkflow) {
          // Show success message and redirect to workflow
          await showSuccessAndRedirect('✓ Tab Connected!', 'Redirecting to next step...', 'workflow-hub.html');
        }
      } catch (err) {
        console.error('Error:', err);
        alert('Failed: ' + err.message);
      } finally {
        activateBtn.disabled = false;
        activateBtn.textContent = 'Connect This Tab';
      }
    });
  }
  
  if (deactivateBtn) {
    deactivateBtn.addEventListener('click', async () => {
      try {
        deactivateBtn.disabled = true;
        await deactivateCurrentTab();
        await updateCurrentTabInfo();
        await updateActiveTabsList();
      } catch (err) {
        console.error('Error:', err);
      } finally {
        deactivateBtn.disabled = false;
      }
    });
  }
  
  setInterval(updateActiveTabsList, 2000);
});

async function showSuccessAndRedirect(title, message, redirectUrl) {
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;

  overlay.innerHTML = `
    <div style="
      background: white;
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    ">
      <div style="font-size: 48px; margin-bottom: 16px;">✓</div>
      <h2 style="margin: 0 0 12px 0; color: #28a745; font-size: 22px;">${title}</h2>
      <p style="margin: 0; color: #666; font-size: 14px;">${message}</p>
    </div>
  `;

  document.body.appendChild(overlay);

  await new Promise(resolve => setTimeout(resolve, 1500));
  window.location.href = redirectUrl;
}


async function updateCurrentTabInfo() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      currentTabId = tabs[0].id;
      currentTabUrl = tabs[0].url;
      
      const urlEl = document.getElementById('currentTabUrl');
      if (urlEl) urlEl.textContent = currentTabUrl || 'Unknown';
      
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TAB_INFO',
        payload: { tabId: currentTabId }
      });
      
      isConnected = response.success && response.data;
      updateConnectionStatus();
    }
  } catch (err) {
    console.error('Error getting tab info:', err);
  }
}

function updateConnectionStatus() {
  const statusEl = document.getElementById('currentTabStatus');
  const activateBtn = document.getElementById('activateBtn');
  const deactivateBtn = document.getElementById('deactivateBtn');
  
  if (isConnected) {
    if (statusEl) {
      statusEl.textContent = 'Connected';
      statusEl.className = 'status-badge connected';
    }
    if (activateBtn) activateBtn.style.display = 'none';
    if (deactivateBtn) deactivateBtn.style.display = 'block';
  } else {
    if (statusEl) {
      statusEl.textContent = 'Disconnected';
      statusEl.className = 'status-badge disconnected';
    }
    if (activateBtn) activateBtn.style.display = 'block';
    if (deactivateBtn) deactivateBtn.style.display = 'none';
  }
}

async function activateCurrentTab() {
  const response = await chrome.runtime.sendMessage({
    type: 'ACTIVATE_TAB',
    payload: { tabId: currentTabId, url: currentTabUrl }
  });
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to activate');
  }
  
  isConnected = true;
  return response.data;
}

async function deactivateCurrentTab() {
  const response = await chrome.runtime.sendMessage({
    type: 'DEACTIVATE_TAB',
    payload: { tabId: currentTabId }
  });
  
  if (!response.success) {
    throw new Error(response.error || 'Failed to deactivate');
  }
  
  isConnected = false;
}

async function updateActiveTabsList() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'GET_ALL_ACTIVE_TABS'
    });
    
    if (response.success && response.data) {
      const tabs = response.data;
      const listEl = document.getElementById('activeTabsList');
      
      if (!listEl) return;
      
      if (tabs.length === 0) {
        listEl.innerHTML = '<div class="empty-state">No active connections</div>';
      } else {
        listEl.innerHTML = tabs.map(tab => 
          '<div class="tab-item"><div class="tab-info">Tab ' + tab.tabId + '</div><span class="port-badge">Port ' + tab.port + '</span></div>'
        ).join('');
      }
    }
  } catch (err) {
    console.error('Error updating tabs:', err);
  }
}
