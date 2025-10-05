/**
 * Popup UI for Browser Inspector Extension
 */

interface TabState {
  isActive: boolean;
  port?: number;
  virtualFilesystemURI?: string;
}

let currentTabId: number | null = null;
let currentTabUrl: string | null = null;
let tabState: TabState = { isActive: false };

/**
 * Initialize popup
 */
async function initialize(): Promise<void> {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id || !tab.url) {
      showError('Could not get current tab information');
      return;
    }

    currentTabId = tab.id;
    currentTabUrl = tab.url;

    // Get tab state from service worker
    const response = await chrome.runtime.sendMessage({
      type: 'GET_TAB_INFO',
      payload: { tabId: currentTabId },
    });

    if (response.success && response.data) {
      tabState = {
        isActive: true,
        port: response.data.port,
        virtualFilesystemURI: response.data.virtualFilesystemURI,
      };
    } else {
      tabState = { isActive: false };
    }

    render();
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    showError('Failed to initialize: ' + (error as Error).message);
  }
}

/**
 * Render popup UI
 */
function render(): void {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="tab-info">
      <div class="tab-info-row">
        <div class="tab-info-label">Status:</div>
        <div class="tab-info-value">
          <span class="status ${tabState.isActive ? 'active' : 'inactive'}">
            ${tabState.isActive ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>
      <div class="tab-info-row">
        <div class="tab-info-label">Tab URL:</div>
        <div class="tab-info-value">${currentTabUrl}</div>
      </div>
      ${tabState.isActive && tabState.port ? `
        <div class="tab-info-row">
          <div class="tab-info-label">Port:</div>
          <div class="tab-info-value">${tabState.port}</div>
        </div>
      ` : ''}
    </div>

    ${tabState.isActive ? `
      <button class="deactivate" id="deactivate-btn">Deactivate Debugging</button>

      ${tabState.port ? `
        <div class="port-info">
          <strong>Connect your AI Assistant:</strong>
          <div>MCP Server: localhost:${tabState.port}</div>
          <div>Virtual Filesystem: ${tabState.virtualFilesystemURI}</div>
          <button class="copy-button" id="copy-port-btn">Copy Port</button>
        </div>
      ` : ''}
    ` : `
      <button class="activate" id="activate-btn">Activate Debugging</button>
    `}
  `;

  // Attach event listeners
  if (tabState.isActive) {
    const deactivateBtn = document.getElementById('deactivate-btn');
    if (deactivateBtn) {
      deactivateBtn.addEventListener('click', handleDeactivate);
    }

    const copyPortBtn = document.getElementById('copy-port-btn');
    if (copyPortBtn && tabState.port) {
      copyPortBtn.addEventListener('click', () => handleCopyPort(tabState.port!));
    }
  } else {
    const activateBtn = document.getElementById('activate-btn');
    if (activateBtn) {
      activateBtn.addEventListener('click', handleActivate);
    }
  }
}

/**
 * Handle activate button click
 */
async function handleActivate(): Promise<void> {
  if (!currentTabId || !currentTabUrl) {
    showError('No tab selected');
    return;
  }

  try {
    // Disable button
    const btn = document.getElementById('activate-btn') as HTMLButtonElement;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Activating...';
    }

    // Send activate message to service worker
    const response = await chrome.runtime.sendMessage({
      type: 'ACTIVATE_TAB',
      payload: { tabId: currentTabId, url: currentTabUrl },
    });

    if (response.success) {
      tabState = {
        isActive: true,
        port: response.data.port,
        virtualFilesystemURI: response.data.virtualFilesystemURI,
      };
      render();
    } else {
      showError('Failed to activate: ' + response.error);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Activate Debugging';
      }
    }
  } catch (error) {
    console.error('Failed to activate tab:', error);
    showError('Failed to activate: ' + (error as Error).message);
  }
}

/**
 * Handle deactivate button click
 */
async function handleDeactivate(): Promise<void> {
  if (!currentTabId) {
    showError('No tab selected');
    return;
  }

  try {
    // Disable button
    const btn = document.getElementById('deactivate-btn') as HTMLButtonElement;
    if (btn) {
      btn.disabled = true;
      btn.textContent = 'Deactivating...';
    }

    // Send deactivate message to service worker
    const response = await chrome.runtime.sendMessage({
      type: 'DEACTIVATE_TAB',
      payload: { tabId: currentTabId },
    });

    if (response.success) {
      tabState = { isActive: false };
      render();
    } else {
      showError('Failed to deactivate: ' + response.error);
      if (btn) {
        btn.disabled = false;
        btn.textContent = 'Deactivate Debugging';
      }
    }
  } catch (error) {
    console.error('Failed to deactivate tab:', error);
    showError('Failed to deactivate: ' + (error as Error).message);
  }
}

/**
 * Handle copy port button click
 */
async function handleCopyPort(port: number): Promise<void> {
  try {
    await navigator.clipboard.writeText(String(port));

    const btn = document.getElementById('copy-port-btn') as HTMLButtonElement;
    if (btn) {
      const originalText = btn.textContent;
      btn.textContent = 'Copied!';
      setTimeout(() => {
        btn.textContent = originalText;
      }, 2000);
    }
  } catch (error) {
    console.error('Failed to copy port:', error);
  }
}

/**
 * Show error message
 */
function showError(message: string): void {
  const content = document.getElementById('content');
  if (!content) return;

  content.innerHTML = `
    <div class="error">${message}</div>
  `;
}

// Initialize when popup opens
initialize();
