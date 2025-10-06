// popup/popup.ts
var currentStep = 0;
var selectedIDE = null;
var IDE_CONFIGS = {
  claude: {
    name: "Claude Desktop",
    path: {
      mac: "~/Library/Application Support/Claude/claude_desktop_config.json",
      linux: "~/.config/Claude/claude_desktop_config.json",
      windows: "%APPDATA%\\Claude\\claude_desktop_config.json"
    },
    config: (extensionPath) => ({
      mcpServers: {
        "browser-inspector": {
          command: "node",
          args: [extensionPath],
          env: {
            NODE_ENV: "production"
          }
        }
      }
    })
  },
  cursor: {
    name: "Cursor",
    path: {
      mac: "~/.cursor/mcp.json",
      linux: "~/.cursor/mcp.json",
      windows: "%USERPROFILE%\\.cursor\\mcp.json"
    },
    config: (extensionPath) => ({
      mcpServers: {
        "browser-inspector": {
          command: "node",
          args: [extensionPath],
          env: {
            NODE_ENV: "production"
          }
        }
      }
    })
  },
  windsurf: {
    name: "Windsurf",
    path: {
      mac: "~/.codeium/windsurf/mcp_config.json",
      linux: "~/.codeium/windsurf/mcp_config.json",
      windows: "%APPDATA%\\Codeium\\windsurf\\mcp_config.json"
    },
    config: (extensionPath) => ({
      mcpServers: {
        "browser-inspector": {
          command: "node",
          args: [extensionPath],
          env: {
            NODE_ENV: "production"
          }
        }
      }
    })
  }
};
function getOS() {
  const platform = navigator.platform.toLowerCase();
  if (platform.includes("mac")) return "mac";
  if (platform.includes("linux")) return "linux";
  return "windows";
}
function getExtensionPath() {
  return "<YOUR_PROJECT_PATH>/mcp-server/dist/index.js";
}
window.nextStep = () => {
  if (currentStep < 3) {
    const currentStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
    const currentDot = document.querySelector(`.step-dot[data-step="${currentStep}"]`);
    if (currentStepEl) currentStepEl.classList.remove("active");
    if (currentDot) {
      currentDot.classList.remove("active");
      currentDot.classList.add("completed");
    }
    currentStep++;
    const nextStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
    const nextDot = document.querySelector(`.step-dot[data-step="${currentStep}"]`);
    if (nextStepEl) nextStepEl.classList.add("active");
    if (nextDot) nextDot.classList.add("active");
    if (currentStep === 2 && selectedIDE) {
      generateConfig();
    }
  }
};
window.prevStep = () => {
  if (currentStep > 0) {
    const currentStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
    const currentDot = document.querySelector(`.step-dot[data-step="${currentStep}"]`);
    if (currentStepEl) currentStepEl.classList.remove("active");
    if (currentDot) currentDot.classList.remove("active");
    currentStep--;
    const prevStepEl = document.querySelector(`.step[data-step="${currentStep}"]`);
    const prevDot = document.querySelector(`.step-dot[data-step="${currentStep}"]`);
    if (prevStepEl) prevStepEl.classList.add("active");
    if (prevDot) {
      prevDot.classList.add("active");
      prevDot.classList.remove("completed");
    }
  }
};
window.resetWizard = () => {
  currentStep = 0;
  selectedIDE = null;
  document.querySelectorAll(".step").forEach((el, index) => {
    if (index === 0) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });
  document.querySelectorAll(".step-dot").forEach((el, index) => {
    el.classList.remove("active", "completed");
    if (index === 0) {
      el.classList.add("active");
    }
  });
  document.querySelectorAll(".ide-option").forEach((el) => {
    el.classList.remove("selected");
  });
  const continueBtn = document.getElementById("continueBtn");
  if (continueBtn) continueBtn.disabled = true;
};
window.selectIDE = (ide) => {
  selectedIDE = ide;
  document.querySelectorAll(".ide-option").forEach((el) => {
    if (el.getAttribute("data-ide") === ide) {
      el.classList.add("selected");
    } else {
      el.classList.remove("selected");
    }
  });
  const continueBtn = document.getElementById("continueBtn");
  if (continueBtn) continueBtn.disabled = false;
};
function generateConfig() {
  if (!selectedIDE) return;
  const ideConfig = IDE_CONFIGS[selectedIDE];
  const os = getOS();
  const extensionPath = getExtensionPath();
  const configPathEl = document.getElementById("configPath");
  if (configPathEl) {
    configPathEl.textContent = ideConfig.path[os];
  }
  const config = ideConfig.config(extensionPath);
  const configJSON = JSON.stringify(config, null, 2);
  const configContentEl = document.getElementById("configContent");
  if (configContentEl) {
    configContentEl.innerHTML = `<pre>${escapeHtml(configJSON)}</pre>`;
  }
  const ideNameFinal = document.getElementById("ideNameFinal");
  if (ideNameFinal) {
    ideNameFinal.textContent = ideConfig.name;
  }
}
window.copyConfig = async () => {
  if (!selectedIDE) return;
  const ideConfig = IDE_CONFIGS[selectedIDE];
  const extensionPath = getExtensionPath();
  const config = ideConfig.config(extensionPath);
  const configJSON = JSON.stringify(config, null, 2);
  try {
    await navigator.clipboard.writeText(configJSON);
    const copyText = document.getElementById("copyText");
    const copyBtn = document.querySelector(".copy-btn");
    if (copyText) copyText.textContent = "\u2705 Copied!";
    if (copyBtn) copyBtn.classList.add("copied");
    setTimeout(() => {
      if (copyText) copyText.textContent = "\u{1F4CB} Copy Configuration";
      if (copyBtn) copyBtn.classList.remove("copied");
    }, 2e3);
  } catch (err) {
    console.error("Failed to copy:", err);
    alert("Failed to copy to clipboard. Please copy manually.");
  }
};
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
document.addEventListener("DOMContentLoaded", () => {
  console.log("Browser MCP Setup Wizard loaded");
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      console.log("Current tab:", tabs[0].url);
    }
  });
});
//# sourceMappingURL=popup.js.map
