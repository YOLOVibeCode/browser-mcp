/**
 * Browser MCP Setup Wizard Logic - Simplified Manual Copy Only
 */

let currentStep = 0;
let selectedIDE: string | null = null;

const IDE_CONFIGS = {
  claude: {
    name: 'Claude Desktop',
    path: {
      mac: '~/Library/Application Support/Claude/claude_desktop_config.json',
      linux: '~/.config/Claude/claude_desktop_config.json',
      windows: '%APPDATA%\\Claude\\claude_desktop_config.json'
    },
    config: (extensionPath: string) => ({
      mcpServers: {
        'browser-inspector': {
          command: 'node',
          args: [extensionPath],
          env: {
            NODE_ENV: 'production'
          }
        }
      }
    })
  },
  cursor: {
    name: 'Cursor',
    path: {
      mac: '~/.cursor/mcp.json',
      linux: '~/.cursor/mcp.json',
      windows: '%USERPROFILE%\\.cursor\\mcp.json'
    },
    config: (extensionPath: string) => ({
      mcpServers: {
        'browser-inspector': {
          command: 'node',
          args: [extensionPath],
          env: {
            NODE_ENV: 'production'
          }
        }
      }
    })
  },
  windsurf: {
    name: 'Windsurf',
    path: {
      mac: '~/.codeium/windsurf/mcp_config.json',
      linux: '~/.codeium/windsurf/mcp_config.json',
      windows: '%APPDATA%\\Codeium\\windsurf\\mcp_config.json'
    },
    config: (extensionPath: string) => ({
      mcpServers: {
        'browser-inspector': {
          command: 'node',
          args: [extensionPath],
          env: {
            NODE_ENV: 'production'
          }
        }
      }
    })
  }
};

// Detect OS
function getOS(): 'mac' | 'linux' | 'windows' {
  try {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes('mac')) return 'mac';
    if (platform.includes('linux')) return 'linux';
    return 'windows';
  } catch (err) {
    console.error('Error detecting OS:', err);
    return 'mac'; // Safe default
  }
}

// Get extension installation path from user input or stored value
function getExtensionPath(): string {
  try {
    const projectPathInput = document.getElementById('projectPath') as HTMLInputElement;
    if (projectPathInput && projectPathInput.value.trim()) {
      return projectPathInput.value.trim();
    }

    // Try to get from storage
    const stored = localStorage.getItem('browserMCP_projectPath');
    if (stored) {
      return stored;
    }

    // Default placeholder
    return '/path/to/browser-mcp/mcp-server/dist/index.js';
  } catch (err) {
    console.error('Error getting extension path:', err);
    return '/path/to/browser-mcp/mcp-server/dist/index.js';
  }
}

// Auto-detect project path (best effort)
async function detectProjectPath() {
  try {
    const projectPathInput = document.getElementById('projectPath') as HTMLInputElement;
    if (!projectPathInput) return;

    // Common installation paths to try
    const commonPaths = [
      '/Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server/dist/index.js',
      '~/Documents/browser-mcp/mcp-server/dist/index.js',
      '~/Projects/browser-mcp/mcp-server/dist/index.js',
      '~/code/browser-mcp/mcp-server/dist/index.js',
    ];

    showStatus('info', '🔍 Trying to detect project path...');

    // For now, just suggest the most likely path
    const suggested = commonPaths[0];
    projectPathInput.value = suggested;

    showStatus('info', `💡 Suggested path filled in. Please verify it's correct!`);

    // Store for next time
    try {
      localStorage.setItem('browserMCP_projectPath', suggested);
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }

    // Regenerate config with new path
    generateConfig();
  } catch (err) {
    console.error('Error in detectProjectPath:', err);
    showStatus('error', '❌ Error detecting path. Please enter manually.');
  }
}

// Navigation functions
function nextStep() {
  try {
    if (currentStep < 3) {
      const currentStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
      const currentDot = document.querySelector(`.step-dot[data-step="${currentStep}"]`);

      if (currentStepEl) currentStepEl.classList.remove('active');
      if (currentDot) {
        currentDot.classList.remove('active');
        currentDot.classList.add('completed');
      }

      currentStep++;

      const nextStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
      const nextDot = document.querySelector(`.step-dot[data-step="${currentStep}"]`);

      if (nextStepEl) nextStepEl.classList.add('active');
      if (nextDot) nextDot.classList.add('active');

      // If moving to step 2, generate config
      if (currentStep === 2 && selectedIDE) {
        generateConfig();
      }
    }
  } catch (err) {
    console.error('Error in nextStep:', err);
  }
}

function prevStep() {
  try {
    if (currentStep > 0) {
      const currentStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
      const currentDot = document.querySelector(`.step-dot[data-step="${currentStep}"]`);

      if (currentStepEl) currentStepEl.classList.remove('active');
      if (currentDot) currentDot.classList.remove('active');

      currentStep--;

      const prevStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
      const prevDot = document.querySelector(`.step-dot[data-step="${currentStep}"]`);

      if (prevStepEl) prevStepEl.classList.add('active');
      if (prevDot) {
        prevDot.classList.add('active');
        prevDot.classList.remove('completed');
      }
    }
  } catch (err) {
    console.error('Error in prevStep:', err);
  }
}

function resetWizard() {
  try {
    currentStep = 0;
    selectedIDE = null;

    // Reset all steps
    document.querySelectorAll('.step').forEach((el, index) => {
      if (index === 0) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Reset all dots
    document.querySelectorAll('.step-dot').forEach((el, index) => {
      el.classList.remove('active', 'completed');
      if (index === 0) {
        el.classList.add('active');
      }
    });

    // Clear IDE selection
    document.querySelectorAll('.ide-option').forEach(el => {
      el.classList.remove('selected');
    });

    const continueBtn = document.getElementById('continueBtn') as HTMLButtonElement;
    if (continueBtn) continueBtn.disabled = true;
  } catch (err) {
    console.error('Error in resetWizard:', err);
  }
}

// IDE selection
function selectIDE(ide: string) {
  try {
    selectedIDE = ide;

    // Update UI
    document.querySelectorAll('.ide-option').forEach(el => {
      if (el.getAttribute('data-ide') === ide) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });

    // Enable continue button
    const continueBtn = document.getElementById('continueBtn') as HTMLButtonElement;
    if (continueBtn) continueBtn.disabled = false;
  } catch (err) {
    console.error('Error in selectIDE:', err);
  }
}

// Generate configuration
function generateConfig() {
  try {
    if (!selectedIDE) return;

    const ideConfig = IDE_CONFIGS[selectedIDE as keyof typeof IDE_CONFIGS];
    if (!ideConfig) {
      console.error('Unknown IDE config:', selectedIDE);
      return;
    }

    const os = getOS();
    const extensionPath = getExtensionPath();
    const defaultPath = ideConfig.path[os];

    // Update config path displays
    const configPathEl = document.getElementById('configPath');
    if (configPathEl) {
      configPathEl.textContent = defaultPath;
    }

    // Generate config JSON
    const config = ideConfig.config(extensionPath);
    const configJSON = JSON.stringify(config, null, 2);

    // Update config content
    const configContentEl = document.getElementById('configContent');
    if (configContentEl) {
      configContentEl.innerHTML = `<pre>${escapeHtml(configJSON)}</pre>`;
    }

    // Update final IDE name
    const ideNameFinal = document.getElementById('ideNameFinal');
    if (ideNameFinal) {
      ideNameFinal.textContent = ideConfig.name;
    }
  } catch (err) {
    console.error('Error in generateConfig:', err);
    showStatus('error', '❌ Error generating configuration. Please refresh and try again.');
  }
}

// Copy configuration to clipboard
async function copyConfig() {
  try {
    if (!selectedIDE) return;

    const ideConfig = IDE_CONFIGS[selectedIDE as keyof typeof IDE_CONFIGS];
    const extensionPath = getExtensionPath();
    const config = ideConfig.config(extensionPath);
    const configJSON = JSON.stringify(config, null, 2);

    try {
      await navigator.clipboard.writeText(configJSON);

      // Update button text
      const copyText = document.getElementById('copyText');
      const copyBtn = document.querySelector('.copy-btn');

      if (copyText) copyText.textContent = '✅ Copied!';
      if (copyBtn) copyBtn.classList.add('copied');

      setTimeout(() => {
        if (copyText) copyText.textContent = '📋 Copy Configuration';
        if (copyBtn) copyBtn.classList.remove('copied');
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy to clipboard. Please copy manually.');
    }
  } catch (err) {
    console.error('Error in copyConfig:', err);
  }
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  try {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  } catch (err) {
    console.error('Error in escapeHtml:', err);
    return text;
  }
}

// Show status message
function showStatus(type: 'success' | 'error' | 'info', message: string) {
  try {
    const statusEl = document.getElementById('configStatus');
    if (!statusEl) {
      console.error('Status element not found');
      return;
    }

    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = 'block';
  } catch (err) {
    console.error('Error in showStatus:', err);
  }
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Browser MCP Setup Wizard loaded');

    // Step 0: Get Started button
    const getStartedBtn = document.getElementById('getStartedBtn');
    if (getStartedBtn) {
      getStartedBtn.addEventListener('click', () => {
        try {
          nextStep();
        } catch (err) {
          console.error('Error in getStartedBtn click:', err);
        }
      });
    }

    // Step 1: IDE selection
    document.querySelectorAll('.ide-option').forEach(el => {
      el.addEventListener('click', () => {
        try {
          const ide = el.getAttribute('data-ide');
          if (ide) selectIDE(ide);
        } catch (err) {
          console.error('Error in ide-option click:', err);
        }
      });
    });

    const backBtn1 = document.getElementById('backBtn1');
    if (backBtn1) {
      backBtn1.addEventListener('click', () => {
        try {
          prevStep();
        } catch (err) {
          console.error('Error in backBtn1 click:', err);
        }
      });
    }

    const continueBtn = document.getElementById('continueBtn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        try {
          nextStep();
        } catch (err) {
          console.error('Error in continueBtn click:', err);
        }
      });
    }

    // Project path input - regenerate config when changed
    const projectPathInput = document.getElementById('projectPath') as HTMLInputElement;
    if (projectPathInput) {
      // Load saved path
      try {
        const saved = localStorage.getItem('browserMCP_projectPath');
        if (saved) {
          projectPathInput.value = saved;
        }
      } catch (err) {
        console.error('Error loading saved path:', err);
      }

      // Regenerate config when path changes
      projectPathInput.addEventListener('input', () => {
        try {
          if (selectedIDE) {
            generateConfig();
          }
        } catch (err) {
          console.error('Error in projectPathInput input:', err);
        }
      });
    }

    const detectBtn = document.getElementById('detectBtn');
    if (detectBtn) {
      detectBtn.addEventListener('click', () => {
        try {
          detectProjectPath();
        } catch (err) {
          console.error('Error in detectBtn click:', err);
        }
      });
    }

    const copyBtn = document.getElementById('copyBtn');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        try {
          copyConfig();
        } catch (err) {
          console.error('Error in copyBtn click:', err);
        }
      });
    }

    const backBtn2 = document.getElementById('backBtn2');
    if (backBtn2) {
      backBtn2.addEventListener('click', () => {
        try {
          prevStep();
        } catch (err) {
          console.error('Error in backBtn2 click:', err);
        }
      });
    }

    const doneConfigBtn = document.getElementById('doneConfigBtn');
    if (doneConfigBtn) {
      doneConfigBtn.addEventListener('click', () => {
        try {
          nextStep();
        } catch (err) {
          console.error('Error in doneConfigBtn click:', err);
        }
      });
    }

    // Step 3: Complete
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        try {
          resetWizard();
        } catch (err) {
          console.error('Error in resetBtn click:', err);
        }
      });
    }

    const closeBtn = document.getElementById('closeBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        try {
          window.close();
        } catch (err) {
          console.error('Error in closeBtn click:', err);
        }
      });
    }

    // Check connection status and update UI
    checkConnectionStatus();
  } catch (err) {
    console.error('Critical error in DOMContentLoaded:', err);
    alert('Extension initialization error. Please refresh the popup.');
  }
});

// Check if extension is connected to current tab
async function checkConnectionStatus() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_TAB_INFO',
        payload: { tabId: tabs[0].id }
      });

      if (response.success && response.data) {
        // Tab is connected
        updateConnectionIndicator(true, response.data);
      } else {
        // Tab is not connected
        updateConnectionIndicator(false, null);
      }
    }
  } catch (err) {
    console.error('Error checking connection status:', err);
    updateConnectionIndicator(false, null);
  }
}

// Update connection indicator in popup
function updateConnectionIndicator(connected: boolean, tabInfo: any) {
  // This will be called to update visual indicators
  console.log('Connection status:', connected ? 'Connected' : 'Not connected', tabInfo);
}
