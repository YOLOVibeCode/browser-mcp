# 🚀 Browser MCP v3.0.3 - Pure JavaScript Chrome Extension

**AI-Powered Browser Debugging Suite for Claude Desktop, Cursor, and Windsurf**

[![Version](https://img.shields.io/badge/version-3.0.3-blue.svg)](https://github.com/YOLOVibeCode/browser-mcp)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Chrome Extension](https://img.shields.io/badge/chrome-extension-brightgreen.svg)]()
[![MCP](https://img.shields.io/badge/protocol-MCP-orange.svg)]()

---

## 🎯 What Is Browser MCP?

Browser MCP is a **pure JavaScript Chrome extension** that exposes complete browser state to AI assistants through the Model Context Protocol (MCP). It provides **33 powerful debugging tools** for inspecting DOM, network, console, storage, and framework state - all accessible to Claude, Cursor, and Windsurf.

### ✨ Key Features

- ✅ **Pure JavaScript** - No build step, no TypeScript compilation
- ✅ **33 Debugging Tools** - DOM inspection, network monitoring, storage management
- ✅ **Framework Detection** - React, Vue, Angular, Svelte, and more
- ✅ **Native Messaging** - Communicates via stdio with AI assistants
- ✅ **Zero Dependencies** - Self-contained Chrome extension
- ✅ **One-Line Install** - Automatic setup script

---

## 📦 Quick Install

### ⚡ One-Command Installation

```bash
curl -fsSL https://raw.githubusercontent.com/YOLOVibeCode/browser-mcp/main/scripts/setup-mcp.sh | bash
```

**That's it!** The script automatically:
1. ✅ Checks & installs prerequisites (Node.js, Python3, Git)
2. ✅ Installs native messaging host via NPM
3. ✅ Detects if Chrome extension is already installed
4. ✅ Configures your IDE (Claude/Cursor/Windsurf)
5. ✅ Tests the connection

### 🎯 What You Need to Do

**First Time Setup:**
1. **Run the curl command** (see above)
2. **Load the extension in Chrome** (only if not already installed):
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the folder shown by the script
3. **Restart your IDE** (Claude/Cursor/Windsurf)

**If Extension Already Installed:**
1. **Run the curl command** (see above)
2. **Restart your IDE**
3. **Done!** 🎉

---

### 📋 Prerequisites (Auto-Installed)

The setup script automatically checks and installs:
- ✅ **Node.js v16+** - Native messaging host
- ✅ **Python 3** - Config file management
- ✅ **Git** - Repository cloning
- ⚠️ **Chrome/Chromium** - Shows warning if missing

**Supported Platforms:**
- **macOS** - Uses Homebrew (auto-installs if needed)
- **Linux** - Supports apt, yum, dnf, pacman, zypper
- **Windows** - Manual installation with download links

### Manual Installation

#### Step 1: Clone Repository
```bash
git clone https://github.com/YOLOVibeCode/browser-mcp.git
cd browser-mcp
```

#### Step 2: Load Chrome Extension
1. Open Chrome and go to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right)
3. Click **Load unpacked**
4. Select the `browser-mcp-extension` folder
5. ✅ Extension loaded!

#### Step 3: Install Native Messaging Host
```bash
cd native-messaging-host

# Mac:
./install-mac.sh

# Linux:
./install-linux.sh

# Windows:
powershell .\install-windows.ps1
```

#### Step 4: Configure Your IDE

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-host"
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-host"
    }
  }
}
```

**Windsurf** (`~/.codeium/windsurf/mcp_config.json`):
```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-host"
    }
  }
}
```

#### Step 5: Restart Your IDE
```bash
# Quit completely (Cmd+Q) and reopen
```

---

## 🛠️ Available Tools (33 Total)

### DOM Inspection (8 tools)
- `getElementInfo` - Get complete element details
- `querySelectors` - jQuery-style DOM queries
- `getAccessibilityTree` - ARIA/a11y inspection
- `getComputedStyles` - Full CSS cascade
- `getElementPosition` - Layout & positioning
- `getVisibilityInfo` - Visibility detection
- `getDOMSnapshot` - Complete DOM tree
- `getEventListeners` - All event handlers

### Network Monitoring (6 tools)
- `getNetworkRequests` - All network activity
- `getRequestHeaders` - HTTP headers
- `getResponseBody` - Response content
- `getResourceTiming` - Performance metrics
- `getWebSocketMessages` - WebSocket traffic
- `clearNetworkCache` - Cache management

### Console & Debugging (5 tools)
- `getConsoleLogs` - All console messages
- `evaluateExpression` - Execute JavaScript
- `getErrorStack` - Stack traces
- `getPerformanceMetrics` - Core Web Vitals
- `getMemoryUsage` - Memory profiling

### Storage Management (5 tools)
- `getLocalStorage` - localStorage inspection
- `getSessionStorage` - sessionStorage inspection
- `getCookies` - Cookie management
- `getIndexedDB` - IndexedDB queries
- `clearStorage` - Storage cleanup

### Framework Detection (4 tools)
- `detectFramework` - Identify framework
- `getComponentState` - React/Vue state
- `getRenderChain` - Component hierarchy
- `traceDataSources` - Data flow tracking

### Source Mapping (3 tools)
- `resolveSourceMap` - Map deployed ↔ local code
- `getOriginalPosition` - Source map lookup
- `listSourceFiles` - Available source files

### Tab Management (2 tools)
- `listActiveTabs` - All browser tabs
- `switchToTab` - Tab navigation

---

## 🏗️ Architecture

```
browser-mcp/
├── browser-mcp-extension/       # Chrome Extension (Pure JavaScript)
│   ├── manifest.json            # Chrome Manifest V3
│   ├── background/
│   │   ├── service-worker.js    # Main entry point
│   │   ├── mcp-server.js        # MCP JSON-RPC server
│   │   ├── tab-manager.js       # Tab state management
│   │   ├── adapters/
│   │   │   ├── chrome-cdp.js    # Chrome Debugger Protocol
│   │   │   └── native-messaging.js # stdio communication
│   │   ├── tools/               # 33 debugging tools
│   │   │   ├── console-tools.js
│   │   │   ├── dom-tools.js
│   │   │   ├── network-tools.js
│   │   │   ├── framework-tools.js
│   │   │   └── ... (11 tool files)
│   │   └── optimization/
│   │       ├── message-filter.js
│   │       └── delta-compression.js
│   ├── popup/                   # Extension UI
│   │   ├── setup-popup.html
│   │   ├── setup-popup.js
│   │   └── popup.css
│   └── tests/                   # Unit tests
│
├── native-messaging-host/       # Native Messaging Bridge
│   ├── host.js                  # Node.js stdio server
│   ├── install-mac.sh           # macOS installer
│   ├── install-linux.sh         # Linux installer
│   └── install-windows.ps1      # Windows installer
│
├── scripts/
│   └── setup-mcp.sh             # Automatic setup script
│
└── releases/                    # Packaged extensions
    └── browser-mcp-extension.zip
```

---

## 🧪 Testing

The extension includes comprehensive tests:

```bash
# Run all tests
npm test

# Or test individual modules
node browser-mcp-extension/tests/mcp-server.test.js
node browser-mcp-extension/tests/chrome-cdp.test.js
node browser-mcp-extension/tests/native-messaging.test.js
```

---

## 🎯 Usage Examples

### Example 1: Inspect Element
**Ask Claude/Cursor:**
> "Show me all properties of the submit button"

**Browser MCP:**
- Uses `getElementInfo` tool
- Returns: classes, IDs, attributes, computed styles, event listeners

### Example 2: Debug Network Request
**Ask Claude/Cursor:**
> "What API calls happened when I clicked that button?"

**Browser MCP:**
- Uses `getNetworkRequests` tool
- Returns: URL, method, status, headers, timing, response

### Example 3: Find Component State
**Ask Claude/Cursor:**
> "What's the current state of the UserProfile component?"

**Browser MCP:**
- Uses `detectFramework` + `getComponentState`
- Returns: props, state, hooks, context values

---

## 🔧 Troubleshooting

### Extension Not Loading
1. Check Chrome version (requires v90+)
2. Enable Developer mode in `chrome://extensions/`
3. Check console for errors

### Native Messaging Not Working
1. Verify host is installed: `which browser-mcp-host`
2. Check permissions: `chmod +x native-messaging-host/host.js`
3. Test connection: `echo '{"test":true}' | browser-mcp-host`

### IDE Not Detecting MCP Server
1. Verify config file location
2. Restart IDE completely (Cmd+Q, then reopen)
3. Check IDE logs for MCP errors

---

## 📚 Documentation

- **Extension README**: [browser-mcp-extension/README.md](browser-mcp-extension/README.md)
- **Native Messaging**: [native-messaging-host/OPTIMIZATIONS.md](native-messaging-host/OPTIMIZATIONS.md)
- **Tool List**: [browser-mcp-extension/ALL_33_TOOLS_COMPLETE.md](browser-mcp-extension/ALL_33_TOOLS_COMPLETE.md)

---

## 🤝 Contributing

Contributions welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Add tests for new features
4. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](LICENSE)

---

## 🌟 Why Browser MCP?

- **Pure JavaScript** - No build step, instant development
- **Chrome Native** - Uses official Chrome DevTools Protocol
- **MCP Compatible** - Works with Claude, Cursor, Windsurf
- **Self-Contained** - No external dependencies
- **Production Ready** - Fully tested with 33 tools

---

**Made with ❤️ by [YOLOVibeCode](https://github.com/YOLOVibeCode)**

**⭐ Star this repo if it helps your debugging workflow!**
