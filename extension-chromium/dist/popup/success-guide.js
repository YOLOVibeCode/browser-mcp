/**
 * Success Guide - Post-test instructions and AI simulator
 */

document.addEventListener('DOMContentLoaded', () => {
  console.log('Success Guide loaded');

  // Detect platform and update config paths
  detectPlatformAndUpdatePaths();

  // IDE Tab Switching
  const ideTabs = document.querySelectorAll('.ide-tab');
  const ideContents = document.querySelectorAll('.ide-content');

  ideTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const ideType = tab.dataset.ide;

      // Update active tab
      ideTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active content
      ideContents.forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${ideType}-content`).classList.add('active');
    });
  });

  // Copy Bash One-Liner Button
  document.getElementById('copyBashBtn').addEventListener('click', async () => {
    const oneLiner = document.getElementById('bashOneLiner').textContent;
    await copyToClipboard(oneLiner, 'copyBashBtn');
  });

  // Copy Batch One-Liner Button
  document.getElementById('copyBatchBtn').addEventListener('click', async () => {
    const oneLiner = document.getElementById('batchOneLiner').textContent;
    await copyToClipboard(oneLiner, 'copyBatchBtn');
  });

  // Copy MCP Config Button
  document.getElementById('copyConfigBtn').addEventListener('click', async () => {
    const config = {
      mcpServers: {
        "browser-inspector": {
          command: "node",
          args: [
            "/Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server/dist/index.js"
          ],
          env: {
            NODE_ENV: "production"
          }
        }
      }
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));

      const btn = document.getElementById('copyConfigBtn');
      const originalText = btn.textContent;
      btn.textContent = '✓ Copied to Clipboard!';
      btn.style.background = '#28a745';

      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert('Failed to copy config. Please copy manually from the instructions above.');
    }
  });

  // Setup AI Simulator Button
  document.getElementById('setupSimulatorBtn').addEventListener('click', () => {
    window.location.href = 'ai-simulator.html';
  });

  // Skip Simulator Button
  document.getElementById('skipSimulatorBtn').addEventListener('click', () => {
    window.location.href = 'workflow-hub.html';
  });

  // Mark IDE as configured
  document.querySelectorAll('.step').forEach(step => {
    step.addEventListener('click', async () => {
      await chrome.storage.local.set({ ideConfigured: true });
    });
  });
});

function detectPlatformAndUpdatePaths() {
  const platform = navigator.platform.toLowerCase();
  const isWindows = platform.includes('win');
  const isMac = platform.includes('mac');
  const isLinux = platform.includes('linux');

  let claudePath, cursorPath, mcpServerPath;

  if (isWindows) {
    claudePath = '%APPDATA%\\Claude\\claude_desktop_config.json';
    cursorPath = '%USERPROFILE%\\.cursor\\mcp.json';
    mcpServerPath = 'C:\\Users\\YourUsername\\browser-mcp\\mcp-server\\dist\\index.js';
  } else if (isMac) {
    claudePath = '~/Library/Application Support/Claude/claude_desktop_config.json';
    cursorPath = '~/.cursor/mcp.json';
    mcpServerPath = '/Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server/dist/index.js';
  } else if (isLinux) {
    claudePath = '~/.config/Claude/claude_desktop_config.json';
    cursorPath = '~/.cursor/mcp.json';
    mcpServerPath = '/home/username/browser-mcp/mcp-server/dist/index.js';
  }

  // Update all code blocks with platform-specific paths
  document.querySelectorAll('.code-block').forEach(block => {
    if (block.textContent.includes('mcpServers')) {
      const config = {
        mcpServers: {
          "browser-inspector": {
            command: "node",
            args: [mcpServerPath],
            env: {
              NODE_ENV: "production"
            }
          }
        }
      };
      block.textContent = JSON.stringify(config, null, 2);
    }
  });

  // Update path displays
  document.querySelectorAll('.step-content code').forEach(code => {
    const text = code.textContent;
    if (text.includes('Library/Application Support/Claude') || text.includes('APPDATA') || text.includes('.config/Claude')) {
      code.textContent = claudePath;
    } else if (text.includes('.cursor')) {
      code.textContent = cursorPath;
    }
  });
}

async function copyToClipboard(text, btnId) {
  try {
    await navigator.clipboard.writeText(text);

    const btn = document.getElementById(btnId);
    const originalText = btn.textContent;
    btn.textContent = '✓ Copied to Clipboard!';
    btn.style.background = '#28a745';

    setTimeout(() => {
      btn.textContent = originalText;
      btn.style.background = '';
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
    alert('Failed to copy. Please copy manually from above.');
  }
}
