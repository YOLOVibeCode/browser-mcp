/**
 * Browser MCP Setup Wizard Logic - Bulletproofed with comprehensive error handling
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

    const defaultConfigPathEl = document.getElementById('defaultConfigPath');
    if (defaultConfigPathEl) {
      defaultConfigPathEl.textContent = defaultPath;
    }

    // Generate config JSON
    const config = ideConfig.config(extensionPath);
    const configJSON = JSON.stringify(config, null, 2);

    // Update config content with syntax highlighting
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
    showStatus('error', '❌ Error copying configuration.');
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

// Track selected configuration method
let configMethod: 'auto' | 'manual' = 'auto';

// Switch between auto and manual configuration
function selectConfigMethod(method: 'auto' | 'manual') {
  try {
    configMethod = method;

    // Update UI
    document.querySelectorAll('.method-option').forEach(el => {
      if (el.getAttribute('data-method') === method) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });

    // Show/hide sections
    const autoSection = document.getElementById('autoConfigSection');
    const manualSection = document.getElementById('manualConfigSection');

    if (autoSection && manualSection) {
      if (method === 'auto') {
        autoSection.style.display = 'block';
        manualSection.style.display = 'none';
      } else {
        autoSection.style.display = 'none';
        manualSection.style.display = 'block';

        // Generate config for manual section too
        if (selectedIDE) {
          const ideConfig = IDE_CONFIGS[selectedIDE as keyof typeof IDE_CONFIGS];
          const os = getOS();
          const extensionPath = getExtensionPath();

          const configPathManual = document.getElementById('configPathManual');
          if (configPathManual) {
            configPathManual.textContent = ideConfig.path[os];
          }

          const config = ideConfig.config(extensionPath);
          const configJSON = JSON.stringify(config, null, 2);

          const configContentManual = document.getElementById('configContentManual');
          if (configContentManual) {
            configContentManual.innerHTML = `<pre>${escapeHtml(configJSON)}</pre>`;
          }
        }
      }
    }
  } catch (err) {
    console.error('Error in selectConfigMethod:', err);
    showStatus('error', '❌ Error switching configuration method.');
  }
}

// Fallback to download method if native messaging fails
function fallbackToDownload(config: any, configPath: string, ide: string) {
  try {
    showStatus('info', '💡 Native host not installed. Downloading config file instead...');

    setTimeout(async () => {
      try {
        const configJSON = JSON.stringify(config, null, 2);

        // Download the config file
        const blob = new Blob([configJSON], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Determine filename based on IDE
        let filename = 'browser-mcp-config.json';
        if (ide === 'claude') {
          filename = 'claude_desktop_config.json';
        } else if (ide === 'cursor') {
          filename = 'mcp.json';
        } else if (ide === 'windsurf') {
          filename = 'mcp_config.json';
        }

        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        // Copy path to clipboard for convenience
        try {
          await navigator.clipboard.writeText(configPath);
          showStatus('success', `✅ Config downloaded! Path copied to clipboard:\n📁 ${configPath}\n\nMove the downloaded file to that location.\n\n💡 Tip: Install native host for automatic writing!`);
        } catch {
          showStatus('success', `✅ Config downloaded as "${filename}"!\n\nMove it to: ${configPath}\n\n💡 Tip: Install native host for automatic writing!`);
        }

        // Auto-advance after showing the message
        setTimeout(() => {
          try {
            nextStep();
          } catch (err) {
            console.error('Error advancing to next step:', err);
          }
        }, 4000);
      } catch (err) {
        console.error('Error in download fallback:', err);
        showStatus('error', '❌ Failed to download config file. Please use manual copy method.');
        setTimeout(() => {
          try {
            selectConfigMethod('manual');
          } catch (e) {
            console.error('Error switching to manual mode:', e);
          }
        }, 2000);
      }
    }, 500);
  } catch (err) {
    console.error('Critical error in fallbackToDownload:', err);
    showStatus('error', '❌ An error occurred. Please refresh and try again.');
  }
}

// Browse for file path
async function browseFilePath() {
  try {
    showStatus('info', 'Note: Chrome extensions cannot browse files directly. Please enter the path manually or use the default location.');
  } catch (err) {
    console.error('Error in browseFilePath:', err);
  }
}

// Write configuration automatically with timeout protection
async function writeConfiguration() {
  if (!selectedIDE) return;

  const statusEl = document.getElementById('writeStatus');
  if (!statusEl) {
    console.error('Status element not found');
    return;
  }

  let port: chrome.runtime.Port | null = null;
  let timeoutId: number | null = null;
  let responseReceived = false;

  try {
    // Validate project path first
    const extensionPath = getExtensionPath();
    if (extensionPath.includes('/path/to/') || extensionPath.includes('<YOUR_PROJECT_PATH>')) {
      showStatus('error', '❌ Please enter your actual Browser MCP project path first!');
      const projectPathInput = document.getElementById('projectPath') as HTMLInputElement;
      if (projectPathInput) {
        projectPathInput.focus();
        projectPathInput.style.borderColor = '#dc3545';
        setTimeout(() => {
          projectPathInput.style.borderColor = '';
        }, 2000);
      }
      return;
    }

    showStatus('info', '🔄 Writing configuration file...');

    const ideConfig = IDE_CONFIGS[selectedIDE as keyof typeof IDE_CONFIGS];
    const os = getOS();
    const customConfigPath = (document.getElementById('customConfigPath') as HTMLInputElement)?.value.trim();
    const configPath = customConfigPath || ideConfig.path[os];

    // Store the project path for future use
    try {
      localStorage.setItem('browserMCP_projectPath', extensionPath);
    } catch (err) {
      console.error('Error saving to localStorage:', err);
    }

    const config = ideConfig.config(extensionPath);

    // Check if chrome.runtime.connectNative is available
    if (!chrome?.runtime?.connectNative) {
      console.log('Native messaging API not available');
      fallbackToDownload(config, configPath, selectedIDE);
      return;
    }

    // Try native messaging first (automatic file writing)
    try {
      port = chrome.runtime.connectNative('com.browser_mcp.native_host');

      // Set up timeout (10 seconds)
      timeoutId = window.setTimeout(() => {
        if (!responseReceived && port) {
          console.log('Native messaging timeout');
          try {
            port.disconnect();
          } catch (err) {
            console.error('Error disconnecting port:', err);
          }
          fallbackToDownload(config, configPath, selectedIDE);
        }
      }, 10000);

      port.onMessage.addListener((response) => {
        try {
          responseReceived = true;
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }

          if (response && response.success) {
            showStatus('success', `✅ Configuration written automatically!\n📁 ${response.path}\n\nRestart your IDE to load the new configuration.`);

            // Auto-advance after showing the message
            setTimeout(() => {
              try {
                nextStep();
              } catch (err) {
                console.error('Error advancing to next step:', err);
              }
            }, 3000);
          } else {
            console.error('Native host error:', response?.error || 'Unknown error');
            // Fall back to download method
            fallbackToDownload(config, configPath, selectedIDE);
          }
        } catch (err) {
          console.error('Error handling native message response:', err);
          fallbackToDownload(config, configPath, selectedIDE);
        }
      });

      port.onDisconnect.addListener(() => {
        try {
          if (!responseReceived) {
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            const error = chrome.runtime.lastError;
            console.log('Native host not available:', error?.message || 'Unknown error');
            // Fall back to download method
            fallbackToDownload(config, configPath, selectedIDE);
          }
        } catch (err) {
          console.error('Error in disconnect handler:', err);
          fallbackToDownload(config, configPath, selectedIDE);
        }
      });

      // Send write config request
      port.postMessage({
        type: 'WRITE_CONFIG',
        path: configPath,
        content: config,
        merge: true // Merge with existing config
      });

    } catch (err) {
      console.log('Native messaging not available, falling back to download', err);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      fallbackToDownload(config, configPath, selectedIDE);
    }
  } catch (err) {
    console.error('Critical error in writeConfiguration:', err);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    showStatus('error', `❌ Error: ${(err as Error).message || 'Unknown error'}`);

    // Show fallback
    setTimeout(() => {
      try {
        selectConfigMethod('manual');
        showStatus('info', '💡 Please use manual copy method instead.');
      } catch (e) {
        console.error('Error showing fallback:', e);
      }
    }, 3000);
  }
}

// Show status message with null checks
function showStatus(type: 'success' | 'error' | 'info', message: string) {
  try {
    const statusEl = document.getElementById('writeStatus');
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

// Initialize on load with comprehensive error handling
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Browser MCP Setup Wizard loaded');

    // Setup event listeners with defensive checks

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

    // Step 2: Config method selection
    document.querySelectorAll('.method-option').forEach(el => {
      el.addEventListener('click', () => {
        try {
          const method = el.getAttribute('data-method') as 'auto' | 'manual';
          if (method) selectConfigMethod(method);
        } catch (err) {
          console.error('Error in method-option click:', err);
        }
      });
    });

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

    const writeConfigBtn = document.getElementById('writeConfigBtn');
    if (writeConfigBtn) {
      writeConfigBtn.addEventListener('click', () => {
        try {
          writeConfiguration();
        } catch (err) {
          console.error('Error in writeConfigBtn click:', err);
          showStatus('error', '❌ An error occurred. Please try manual copy instead.');
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

    // Detect current tab info
    try {
      if (chrome?.tabs?.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          try {
            if (tabs && tabs[0]) {
              console.log('Current tab:', tabs[0].url);
              // Extension is active for this tab
            }
          } catch (err) {
            console.error('Error in tabs query callback:', err);
          }
        });
      }
    } catch (err) {
      console.error('Error querying tabs:', err);
    }
  } catch (err) {
    console.error('Critical error in DOMContentLoaded:', err);
    alert('Extension initialization error. Please refresh the popup.');
  }
});
