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
  try {
    const platform = navigator.platform.toLowerCase();
    if (platform.includes("mac")) return "mac";
    if (platform.includes("linux")) return "linux";
    return "windows";
  } catch (err) {
    console.error("Error detecting OS:", err);
    return "mac";
  }
}
function getExtensionPath() {
  try {
    const projectPathInput = document.getElementById("projectPath");
    if (projectPathInput && projectPathInput.value.trim()) {
      return projectPathInput.value.trim();
    }
    const stored = localStorage.getItem("browserMCP_projectPath");
    if (stored) {
      return stored;
    }
    return "/path/to/browser-mcp/mcp-server/dist/index.js";
  } catch (err) {
    console.error("Error getting extension path:", err);
    return "/path/to/browser-mcp/mcp-server/dist/index.js";
  }
}
async function detectProjectPath() {
  try {
    const projectPathInput = document.getElementById("projectPath");
    if (!projectPathInput) return;
    const commonPaths = [
      "/Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server/dist/index.js",
      "~/Documents/browser-mcp/mcp-server/dist/index.js",
      "~/Projects/browser-mcp/mcp-server/dist/index.js",
      "~/code/browser-mcp/mcp-server/dist/index.js"
    ];
    showStatus("info", "\u{1F50D} Trying to detect project path...");
    const suggested = commonPaths[0];
    projectPathInput.value = suggested;
    showStatus("info", `\u{1F4A1} Suggested path filled in. Please verify it's correct!`);
    try {
      localStorage.setItem("browserMCP_projectPath", suggested);
    } catch (err) {
      console.error("Error saving to localStorage:", err);
    }
    generateConfig();
  } catch (err) {
    console.error("Error in detectProjectPath:", err);
    showStatus("error", "\u274C Error detecting path. Please enter manually.");
  }
}
function nextStep() {
  try {
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
  } catch (err) {
    console.error("Error in nextStep:", err);
  }
}
function prevStep() {
  try {
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
  } catch (err) {
    console.error("Error in prevStep:", err);
  }
}
function resetWizard() {
  try {
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
  } catch (err) {
    console.error("Error in resetWizard:", err);
  }
}
function selectIDE(ide) {
  try {
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
  } catch (err) {
    console.error("Error in selectIDE:", err);
  }
}
function generateConfig() {
  try {
    if (!selectedIDE) return;
    const ideConfig = IDE_CONFIGS[selectedIDE];
    if (!ideConfig) {
      console.error("Unknown IDE config:", selectedIDE);
      return;
    }
    const os = getOS();
    const extensionPath = getExtensionPath();
    const defaultPath = ideConfig.path[os];
    const configPathEl = document.getElementById("configPath");
    if (configPathEl) {
      configPathEl.textContent = defaultPath;
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
  } catch (err) {
    console.error("Error in generateConfig:", err);
    showStatus("error", "\u274C Error generating configuration. Please refresh and try again.");
  }
}
async function copyConfig() {
  try {
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
  } catch (err) {
    console.error("Error in copyConfig:", err);
  }
}
function escapeHtml(text) {
  try {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  } catch (err) {
    console.error("Error in escapeHtml:", err);
    return text;
  }
}
function showStatus(type, message) {
  try {
    const statusEl = document.getElementById("configStatus");
    if (!statusEl) {
      console.error("Status element not found");
      return;
    }
    statusEl.textContent = message;
    statusEl.className = `status-message ${type}`;
    statusEl.style.display = "block";
  } catch (err) {
    console.error("Error in showStatus:", err);
  }
}
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("Browser MCP Setup Wizard loaded");
    const getStartedBtn = document.getElementById("getStartedBtn");
    if (getStartedBtn) {
      getStartedBtn.addEventListener("click", () => {
        try {
          nextStep();
        } catch (err) {
          console.error("Error in getStartedBtn click:", err);
        }
      });
    }
    document.querySelectorAll(".ide-option").forEach((el) => {
      el.addEventListener("click", () => {
        try {
          const ide = el.getAttribute("data-ide");
          if (ide) selectIDE(ide);
        } catch (err) {
          console.error("Error in ide-option click:", err);
        }
      });
    });
    const backBtn1 = document.getElementById("backBtn1");
    if (backBtn1) {
      backBtn1.addEventListener("click", () => {
        try {
          prevStep();
        } catch (err) {
          console.error("Error in backBtn1 click:", err);
        }
      });
    }
    const continueBtn = document.getElementById("continueBtn");
    if (continueBtn) {
      continueBtn.addEventListener("click", () => {
        try {
          nextStep();
        } catch (err) {
          console.error("Error in continueBtn click:", err);
        }
      });
    }
    const projectPathInput = document.getElementById("projectPath");
    if (projectPathInput) {
      try {
        const saved = localStorage.getItem("browserMCP_projectPath");
        if (saved) {
          projectPathInput.value = saved;
        }
      } catch (err) {
        console.error("Error loading saved path:", err);
      }
      projectPathInput.addEventListener("input", () => {
        try {
          if (selectedIDE) {
            generateConfig();
          }
        } catch (err) {
          console.error("Error in projectPathInput input:", err);
        }
      });
    }
    const detectBtn = document.getElementById("detectBtn");
    if (detectBtn) {
      detectBtn.addEventListener("click", () => {
        try {
          detectProjectPath();
        } catch (err) {
          console.error("Error in detectBtn click:", err);
        }
      });
    }
    const copyBtn = document.getElementById("copyBtn");
    if (copyBtn) {
      copyBtn.addEventListener("click", () => {
        try {
          copyConfig();
        } catch (err) {
          console.error("Error in copyBtn click:", err);
        }
      });
    }
    const backBtn2 = document.getElementById("backBtn2");
    if (backBtn2) {
      backBtn2.addEventListener("click", () => {
        try {
          prevStep();
        } catch (err) {
          console.error("Error in backBtn2 click:", err);
        }
      });
    }
    const doneConfigBtn = document.getElementById("doneConfigBtn");
    if (doneConfigBtn) {
      doneConfigBtn.addEventListener("click", () => {
        try {
          nextStep();
        } catch (err) {
          console.error("Error in doneConfigBtn click:", err);
        }
      });
    }
    const resetBtn = document.getElementById("resetBtn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        try {
          resetWizard();
        } catch (err) {
          console.error("Error in resetBtn click:", err);
        }
      });
    }
    const closeBtn = document.getElementById("closeBtn");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        try {
          window.close();
        } catch (err) {
          console.error("Error in closeBtn click:", err);
        }
      });
    }
    checkConnectionStatus();
  } catch (err) {
    console.error("Critical error in DOMContentLoaded:", err);
    alert("Extension initialization error. Please refresh the popup.");
  }
});
async function checkConnectionStatus() {
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0]) {
      const response = await chrome.runtime.sendMessage({
        type: "GET_TAB_INFO",
        payload: { tabId: tabs[0].id }
      });
      if (response.success && response.data) {
        updateConnectionIndicator(true, response.data);
      } else {
        updateConnectionIndicator(false, null);
      }
    }
  } catch (err) {
    console.error("Error checking connection status:", err);
    updateConnectionIndicator(false, null);
  }
}
function updateConnectionIndicator(connected, tabInfo) {
  console.log("Connection status:", connected ? "Connected" : "Not connected", tabInfo);
}
//# sourceMappingURL=popup.js.map
