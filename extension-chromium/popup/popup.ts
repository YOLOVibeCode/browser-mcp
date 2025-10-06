/**
 * Browser MCP Setup Wizard Logic
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
  const platform = navigator.platform.toLowerCase();
  if (platform.includes('mac')) return 'mac';
  if (platform.includes('linux')) return 'linux';
  return 'windows';
}

// Get extension installation path (placeholder - user needs to configure)
function getExtensionPath(): string {
  // TODO: This should be detected or user-configurable
  // For now, provide instructional text
  return '<YOUR_PROJECT_PATH>/mcp-server/dist/index.js';
}

// Navigation functions
(window as any).nextStep = () => {
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
};

(window as any).prevStep = () => {
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
};

(window as any).resetWizard = () => {
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
};

// IDE selection
(window as any).selectIDE = (ide: string) => {
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
};

// Generate configuration
function generateConfig() {
  if (!selectedIDE) return;

  const ideConfig = IDE_CONFIGS[selectedIDE as keyof typeof IDE_CONFIGS];
  const os = getOS();
  const extensionPath = getExtensionPath();

  // Update config path
  const configPathEl = document.getElementById('configPath');
  if (configPathEl) {
    configPathEl.textContent = ideConfig.path[os];
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
}

// Copy configuration to clipboard
(window as any).copyConfig = async () => {
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
};

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  console.log('Browser MCP Setup Wizard loaded');

  // Detect current tab info
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      console.log('Current tab:', tabs[0].url);
      // Extension is active for this tab
    }
  });
});
