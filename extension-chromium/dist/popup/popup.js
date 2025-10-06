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
    const defaultConfigPathEl = document.getElementById("defaultConfigPath");
    if (defaultConfigPathEl) {
      defaultConfigPathEl.textContent = defaultPath;
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
    showStatus("error", "\u274C Error copying configuration.");
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
var configMethod = "auto";
function selectConfigMethod(method) {
  try {
    configMethod = method;
    document.querySelectorAll(".method-option").forEach((el) => {
      if (el.getAttribute("data-method") === method) {
        el.classList.add("selected");
      } else {
        el.classList.remove("selected");
      }
    });
    const autoSection = document.getElementById("autoConfigSection");
    const manualSection = document.getElementById("manualConfigSection");
    if (autoSection && manualSection) {
      if (method === "auto") {
        autoSection.style.display = "block";
        manualSection.style.display = "none";
      } else {
        autoSection.style.display = "none";
        manualSection.style.display = "block";
        if (selectedIDE) {
          const ideConfig = IDE_CONFIGS[selectedIDE];
          const os = getOS();
          const extensionPath = getExtensionPath();
          const configPathManual = document.getElementById("configPathManual");
          if (configPathManual) {
            configPathManual.textContent = ideConfig.path[os];
          }
          const config = ideConfig.config(extensionPath);
          const configJSON = JSON.stringify(config, null, 2);
          const configContentManual = document.getElementById("configContentManual");
          if (configContentManual) {
            configContentManual.innerHTML = `<pre>${escapeHtml(configJSON)}</pre>`;
          }
        }
      }
    }
  } catch (err) {
    console.error("Error in selectConfigMethod:", err);
    showStatus("error", "\u274C Error switching configuration method.");
  }
}
function fallbackToDownload(config, configPath, ide) {
  try {
    showStatus("info", "\u{1F4A1} Native host not installed. Downloading config file instead...");
    setTimeout(async () => {
      try {
        const configJSON = JSON.stringify(config, null, 2);
        const blob = new Blob([configJSON], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        let filename = "browser-mcp-config.json";
        if (ide === "claude") {
          filename = "claude_desktop_config.json";
        } else if (ide === "cursor") {
          filename = "mcp.json";
        } else if (ide === "windsurf") {
          filename = "mcp_config.json";
        }
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        try {
          await navigator.clipboard.writeText(configPath);
          showStatus("success", `\u2705 Config downloaded! Path copied to clipboard:
\u{1F4C1} ${configPath}

Move the downloaded file to that location.

\u{1F4A1} Tip: Install native host for automatic writing!`);
        } catch {
          showStatus("success", `\u2705 Config downloaded as "${filename}"!

Move it to: ${configPath}

\u{1F4A1} Tip: Install native host for automatic writing!`);
        }
        setTimeout(() => {
          try {
            nextStep();
          } catch (err) {
            console.error("Error advancing to next step:", err);
          }
        }, 4e3);
      } catch (err) {
        console.error("Error in download fallback:", err);
        showStatus("error", "\u274C Failed to download config file. Please use manual copy method.");
        setTimeout(() => {
          try {
            selectConfigMethod("manual");
          } catch (e) {
            console.error("Error switching to manual mode:", e);
          }
        }, 2e3);
      }
    }, 500);
  } catch (err) {
    console.error("Critical error in fallbackToDownload:", err);
    showStatus("error", "\u274C An error occurred. Please refresh and try again.");
  }
}
async function writeConfiguration() {
  if (!selectedIDE) return;
  const statusEl = document.getElementById("writeStatus");
  if (!statusEl) {
    console.error("Status element not found");
    return;
  }
  let port = null;
  let timeoutId = null;
  let responseReceived = false;
  try {
    const extensionPath = getExtensionPath();
    if (extensionPath.includes("/path/to/") || extensionPath.includes("<YOUR_PROJECT_PATH>")) {
      showStatus("error", "\u274C Please enter your actual Browser MCP project path first!");
      const projectPathInput = document.getElementById("projectPath");
      if (projectPathInput) {
        projectPathInput.focus();
        projectPathInput.style.borderColor = "#dc3545";
        setTimeout(() => {
          projectPathInput.style.borderColor = "";
        }, 2e3);
      }
      return;
    }
    showStatus("info", "\u{1F504} Writing configuration file...");
    const ideConfig = IDE_CONFIGS[selectedIDE];
    const os = getOS();
    const customConfigPath = document.getElementById("customConfigPath")?.value.trim();
    const configPath = customConfigPath || ideConfig.path[os];
    try {
      localStorage.setItem("browserMCP_projectPath", extensionPath);
    } catch (err) {
      console.error("Error saving to localStorage:", err);
    }
    const config = ideConfig.config(extensionPath);
    if (!chrome?.runtime?.connectNative) {
      console.log("Native messaging API not available");
      fallbackToDownload(config, configPath, selectedIDE);
      return;
    }
    try {
      port = chrome.runtime.connectNative("com.browser_mcp.native_host");
      timeoutId = window.setTimeout(() => {
        if (!responseReceived && port) {
          console.log("Native messaging timeout");
          try {
            port.disconnect();
          } catch (err) {
            console.error("Error disconnecting port:", err);
          }
          fallbackToDownload(config, configPath, selectedIDE);
        }
      }, 1e4);
      port.onMessage.addListener((response) => {
        try {
          responseReceived = true;
          if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
          }
          if (response && response.success) {
            showStatus("success", `\u2705 Configuration written automatically!
\u{1F4C1} ${response.path}

Restart your IDE to load the new configuration.`);
            setTimeout(() => {
              try {
                nextStep();
              } catch (err) {
                console.error("Error advancing to next step:", err);
              }
            }, 3e3);
          } else {
            console.error("Native host error:", response?.error || "Unknown error");
            fallbackToDownload(config, configPath, selectedIDE);
          }
        } catch (err) {
          console.error("Error handling native message response:", err);
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
            console.log("Native host not available:", error?.message || "Unknown error");
            fallbackToDownload(config, configPath, selectedIDE);
          }
        } catch (err) {
          console.error("Error in disconnect handler:", err);
          fallbackToDownload(config, configPath, selectedIDE);
        }
      });
      port.postMessage({
        type: "WRITE_CONFIG",
        path: configPath,
        content: config,
        merge: true
        // Merge with existing config
      });
    } catch (err) {
      console.log("Native messaging not available, falling back to download", err);
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      fallbackToDownload(config, configPath, selectedIDE);
    }
  } catch (err) {
    console.error("Critical error in writeConfiguration:", err);
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    showStatus("error", `\u274C Error: ${err.message || "Unknown error"}`);
    setTimeout(() => {
      try {
        selectConfigMethod("manual");
        showStatus("info", "\u{1F4A1} Please use manual copy method instead.");
      } catch (e) {
        console.error("Error showing fallback:", e);
      }
    }, 3e3);
  }
}
function showStatus(type, message) {
  try {
    const statusEl = document.getElementById("writeStatus");
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
    document.querySelectorAll(".method-option").forEach((el) => {
      el.addEventListener("click", () => {
        try {
          const method = el.getAttribute("data-method");
          if (method) selectConfigMethod(method);
        } catch (err) {
          console.error("Error in method-option click:", err);
        }
      });
    });
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
    const writeConfigBtn = document.getElementById("writeConfigBtn");
    if (writeConfigBtn) {
      writeConfigBtn.addEventListener("click", () => {
        try {
          writeConfiguration();
        } catch (err) {
          console.error("Error in writeConfigBtn click:", err);
          showStatus("error", "\u274C An error occurred. Please try manual copy instead.");
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
    try {
      if (chrome?.tabs?.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          try {
            if (tabs && tabs[0]) {
              console.log("Current tab:", tabs[0].url);
            }
          } catch (err) {
            console.error("Error in tabs query callback:", err);
          }
        });
      }
    } catch (err) {
      console.error("Error querying tabs:", err);
    }
  } catch (err) {
    console.error("Critical error in DOMContentLoaded:", err);
    alert("Extension initialization error. Please refresh the popup.");
  }
});
//# sourceMappingURL=popup.js.map
