# 🚀 Browser MCP v3.0.3 - Pure JavaScript Chrome Extension

**Chrome-native, zero dependencies, self-contained MCP server**

## ✨ Key Features

- ✅ **Pure JavaScript** - No TypeScript, no build step
- ✅ **Chrome Native** - Uses only Chrome APIs
- ✅ **33 Powerful Tools** - Complete debugging suite
- ✅ **Self-Contained** - No external dependencies
- ✅ **Instant Load** - Load unpacked directly in Chrome
- ✅ **TDD & ISP** - Test-driven, interface segregation

## 📦 Installation

### Step 1: Load Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right)
3. Click "Load unpacked"
4. Select the `browser-mcp-extension` folder
5. ✅ Extension loaded!

### Step 2: Install Native Messaging Host

```bash
cd ../native-messaging-host

# Mac:
./install-mac.sh

# Linux:
./install-linux.sh

# Windows:
powershell .\install-windows.ps1
```

### Step 3: Configure Your IDE

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

**Cursor** (`.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-host"
    }
  }
}
```

## 🛠️ Architecture

```
browser-mcp-extension/
├── manifest.json              # Chrome Manifest V3
├── background/
│   ├── service-worker.js      # Main entry point
│   ├── mcp-server.js          # MCP JSON-RPC server
│   ├── tab-manager.js         # Tab state management
│   ├── adapters/
│   │   ├── chrome-cdp.js      # Chrome Debugger Protocol
│   │   └── native-messaging.js # stdio communication
│   ├── tools/
│   │   ├── console-tools.js   # Console inspection
│   │   ├── dom-tools.js       # DOM extraction
│   │   ├── network-tools.js   # Network monitoring
│   │   └── ... (33 tools)
│   └── optimization/
│       ├── message-filter.js  # Noise filtering
│       └── delta-compression.js # Change tracking
├── popup/
│   ├── popup.html             # Status UI
│   ├── popup.js               # UI logic
│   └── popup.css              # Styles
└── icons/                     # Extension icons
```

## 🧪 Testing

```bash
# Run tests (uses Chrome's test infrastructure)
npm test

# Or manually test each module
node tests/tab-manager.test.js
node tests/chrome-cdp.test.js
```

## 🎯 Design Principles

1. **ISP (Interface Segregation)** - Small, focused interfaces
2. **TDD (Test-Driven Development)** - Tests first, code second
3. **Chrome-Native** - Only Chrome APIs, no Node.js dependencies
4. **Self-Contained** - Everything in one folder
5. **Pure JavaScript** - ES modules, no compilation

## 📚 Documentation

See `../documents/` for complete documentation.

---

**Status**: Pure JavaScript Chrome Extension
**Version**: 3.0.0
**Build**: None required! Load directly in Chrome.

