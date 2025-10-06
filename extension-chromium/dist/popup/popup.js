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
  const projectPathInput = document.getElementById("projectPath");
  if (projectPathInput && projectPathInput.value.trim()) {
    return projectPathInput.value.trim();
  }
  const stored = localStorage.getItem("browserMCP_projectPath");
  if (stored) {
    return stored;
  }
  return "/path/to/browser-mcp/mcp-server/dist/index.js";
}
async function detectProjectPath() {
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
  localStorage.setItem("browserMCP_projectPath", suggested);
  generateConfig();
}
function nextStep() {
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
}
function prevStep() {
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
}
function resetWizard() {
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
}
function selectIDE(ide) {
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
}
function generateConfig() {
  if (!selectedIDE) return;
  const ideConfig = IDE_CONFIGS[selectedIDE];
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
}
async function copyConfig() {
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
}
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
var configMethod = "auto";
function selectConfigMethod(method) {
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
}
function fallbackToDownload(config, configPath, ide) {
  showStatus("info", "\u{1F4A1} Native host not installed. Downloading config file instead...");
  setTimeout(async () => {
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
      nextStep();
    }, 4e3);
  }, 500);
}
async function writeConfiguration() {
  if (!selectedIDE) return;
  const statusEl = document.getElementById("writeStatus");
  if (!statusEl) return;
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
    localStorage.setItem("browserMCP_projectPath", extensionPath);
    const config = ideConfig.config(extensionPath);
    try {
      const port = chrome.runtime.connectNative("com.browser_mcp.native_host");
      port.onMessage.addListener((response) => {
        if (response.success) {
          showStatus("success", `\u2705 Configuration written automatically!
\u{1F4C1} ${response.path}

Restart your IDE to load the new configuration.`);
          setTimeout(() => {
            nextStep();
          }, 3e3);
        } else {
          console.error("Native host error:", response.error);
          fallbackToDownload(config, configPath, selectedIDE);
        }
      });
      port.onDisconnect.addListener(() => {
        const error = chrome.runtime.lastError;
        console.log("Native host not available:", error?.message);
        fallbackToDownload(config, configPath, selectedIDE);
      });
      port.postMessage({
        type: "WRITE_CONFIG",
        path: configPath,
        content: config,
        merge: true
        // Merge with existing config
      });
    } catch (err) {
      console.log("Native messaging not available, falling back to download");
      fallbackToDownload(config, configPath, selectedIDE);
    }
  } catch (err) {
    console.error("Download config error:", err);
    showStatus("error", `\u274C Error: ${err.message}`);
    setTimeout(() => {
      selectConfigMethod("manual");
      showStatus("info", "\u{1F4A1} Please use manual copy method instead.");
    }, 3e3);
  }
}
function showStatus(type, message) {
  const statusEl = document.getElementById("writeStatus");
  if (!statusEl) return;
  statusEl.textContent = message;
  statusEl.className = `status-message ${type}`;
  statusEl.style.display = "block";
}
document.addEventListener("DOMContentLoaded", () => {
  console.log("Browser MCP Setup Wizard loaded");
  const getStartedBtn = document.getElementById("getStartedBtn");
  if (getStartedBtn) {
    getStartedBtn.addEventListener("click", nextStep);
  }
  document.querySelectorAll(".ide-option").forEach((el) => {
    el.addEventListener("click", () => {
      const ide = el.getAttribute("data-ide");
      if (ide) selectIDE(ide);
    });
  });
  const backBtn1 = document.getElementById("backBtn1");
  if (backBtn1) backBtn1.addEventListener("click", prevStep);
  const continueBtn = document.getElementById("continueBtn");
  if (continueBtn) continueBtn.addEventListener("click", nextStep);
  document.querySelectorAll(".method-option").forEach((el) => {
    el.addEventListener("click", () => {
      const method = el.getAttribute("data-method");
      if (method) selectConfigMethod(method);
    });
  });
  const projectPathInput = document.getElementById("projectPath");
  if (projectPathInput) {
    const saved = localStorage.getItem("browserMCP_projectPath");
    if (saved) {
      projectPathInput.value = saved;
    }
    projectPathInput.addEventListener("input", () => {
      if (selectedIDE) {
        generateConfig();
      }
    });
  }
  const detectBtn = document.getElementById("detectBtn");
  if (detectBtn) detectBtn.addEventListener("click", detectProjectPath);
  const writeConfigBtn = document.getElementById("writeConfigBtn");
  if (writeConfigBtn) writeConfigBtn.addEventListener("click", writeConfiguration);
  const copyBtn = document.getElementById("copyBtn");
  if (copyBtn) copyBtn.addEventListener("click", copyConfig);
  const backBtn2 = document.getElementById("backBtn2");
  if (backBtn2) backBtn2.addEventListener("click", prevStep);
  const doneConfigBtn = document.getElementById("doneConfigBtn");
  if (doneConfigBtn) doneConfigBtn.addEventListener("click", nextStep);
  const resetBtn = document.getElementById("resetBtn");
  if (resetBtn) resetBtn.addEventListener("click", resetWizard);
  const closeBtn = document.getElementById("closeBtn");
  if (closeBtn) closeBtn.addEventListener("click", () => window.close());
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      console.log("Current tab:", tabs[0].url);
    }
  });
});
//# sourceMappingURL=popup.js.map
