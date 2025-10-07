# Browser MCP

> Expose browser state to AI assistants via the Model Context Protocol

[![Tests](https://img.shields.io/badge/tests-162%20passing-brightgreen)]()
[![npm](https://img.shields.io/npm/v/browser-mcp-companion)](https://www.npmjs.com/package/browser-mcp-companion)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3%2B-blue)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Debug and inspect your browser with AI assistants like Claude Code, Claude Desktop, Cursor, and Windsurf!

---

## ⚡ Quick Install (One-Liner)

**Automatically configure your IDE with one command:**

### Mac/Linux:
```bash
curl -fsSL https://raw.githubusercontent.com/YOLOVibeCode/browser-mcp/main/scripts/install-mcp.sh | bash
```

### Windows (PowerShell):
```powershell
iwr -useb https://raw.githubusercontent.com/YOLOVibeCode/browser-mcp/main/scripts/install-mcp.bat | iex
```

**What it does:** Detects your OS, verifies Node.js, configures Claude Desktop or Cursor IDE, backs up existing configs, and tests the MCP server automatically.

**After running:** Install Chrome extension (see below) and start the companion app.

---

## 🚀 Manual Setup (2 Minutes)

<details>
<summary><strong>Click to expand manual installation steps</strong></summary>

### 1. Install Companion App

```bash
npm install -g browser-mcp-companion
```

### 2. Start Server

```bash
browser-mcp-companion
```

### 3. Configure Your IDE

#### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "browser-inspector": {
      "command": "node",
      "args": ["/absolute/path/to/browser-mcp/mcp-server/dist/index.js"]
    }
  }
}
```

**[→ Full Claude Desktop Setup Guide](./START_HERE.md)**

#### Cursor

See **[CURSOR_INTEGRATION.md](./CURSOR_INTEGRATION.md)** for detailed setup.

#### Windsurf

See **[WINDSURF_INTEGRATION.md](./WINDSURF_INTEGRATION.md)** for detailed setup.

</details>

---

## 📦 Install Chrome Extension

1. Download or clone this repository
2. Build: `npm run build`
3. Open Chrome → `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" → Select `extension-chromium/dist/`

---

## 🎯 Connect a Tab

1. Navigate to any website in Chrome
2. Click the Browser Inspector extension icon
3. Follow the 3-step workflow:
   - **Step 1:** Connect browser tab
   - **Step 2:** Run MCP tests (built-in)
   - **Step 3:** Configure IDE (with one-liner or manual)

✅ **Done!** Your browser is now connected to AI assistants.

---

## ✨ What Can You Do?

Once connected, ask your AI assistant:

- "What's in the DOM of this page?"
- "Show me all console errors"
- "What network requests were made?"
- "What JavaScript frameworks are detected?"  
- "Analyze the performance of this page"
- "Find all forms on the page"
- "Show me the page's meta tags"

---

## 📦 Architecture

```
browser-mcp/
├── companion-app/       # NPM package - Easy server startup
├── extension-chromium/  # Chrome extension - Browser connector
├── mcp-server/          # MCP server - AI assistant interface
├── contracts/           # TypeScript interfaces
├── infrastructure/      # Core implementations
└── test-harnesses/      # Testing infrastructure
```

**162 tests passing** with real browser testing via Playwright.

---

## 🎯 Features

### For Users
- **One-command setup** with companion app
- **Auto-detection** of running server
- **Step-by-step UI** in extension
- **Works with multiple AI assistants**

### For Developers
- **Test-Driven Development** (TDD methodology)
- **ISP-compliant** architecture
- **Real implementations** (no mocks)
- **Comprehensive E2E tests** with Playwright

### MCP Resources
- `browser://tab-{host}/dom/html` - Live HTML
- `browser://tab-{host}/console/logs` - Console messages
- `browser://tab-{host}/network/requests` - Network activity
- `browser://tab-{host}/metadata/frameworks` - Detected frameworks

### MCP Tools
- `listActiveTabs` - List connected browser tabs
- `getTabInfo` - Get tab details
- `pinTab` - Pin tab to session
- `unpinTab` - Unpin tab
- And more...

---

## 📚 Documentation

- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute setup guide
- **[START_HERE.md](./START_HERE.md)** - Automated setup script
- **[CURSOR_INTEGRATION.md](./CURSOR_INTEGRATION.md)** - Cursor IDE setup
- **[WINDSURF_INTEGRATION.md](./WINDSURF_INTEGRATION.md)** - Windsurf IDE setup
- **[TAB_PINNING_GUIDE.md](./TAB_PINNING_GUIDE.md)** - Session management
- **[TESTING.md](./TESTING.md)** - Comprehensive testing guide

---

## 🧪 Development

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
npm test              # All unit tests
npm run test:e2e      # E2E tests
```

### Build

```bash
npm run build         # Build all packages
```

### Run MCP Server Manually

```bash
cd mcp-server
npm start
```

---

## 📊 Test Coverage

| Component | Tests | Status |
|-----------|-------|--------|
| EventEmitterBus | 8 | ✅ |
| PortManager | 17 | ✅ |
| TabManager | 22 | ✅ |
| SessionManager | 24 | ✅ |
| FrameworkDetector | 21 | ✅ |
| CDPAdapter | 15 | ✅ |
| MCPServer | 19 | ✅ |
| StdioTransport | 10 | ✅ |
| VirtualFilesystem | 15 | ✅ |
| E2E Tests | 7 | ✅ |
| **Total** | **162** | ✅ |

---

## 🐛 Troubleshooting

### Extension not loading
- Check Chrome version (requires Manifest v3)
- Rebuild: `cd extension-chromium && npm run build`
- Check console for errors

### Companion app won't start
- Port 3100 in use? Kill it: `lsof -i :3100 | grep LISTEN | awk '{print $2}' | xargs kill -9`
- Check Node.js version (requires 18+)

### Extension can't connect
- Make sure companion app is running
- Check http://localhost:3100 in browser
- Reload extension in Chrome

### AI assistant not seeing browser
- Check MCP server config path is absolute
- Restart AI assistant after config change
- Check logs in assistant's developer console

---

## 🤝 Contributing

We follow TDD methodology:
1. Write tests first (RED)
2. Implement to pass (GREEN)
3. Refactor (REFACTOR)

All interfaces in `contracts/` package. No mocks - use real implementations.

---

## 📝 License

MIT © Browser MCP Contributors

---

## 🎊 Acknowledgments

Built with:
- TypeScript 5.3+
- Playwright (real browser testing)
- Vitest (fast unit testing)
- Express (companion app server)
- Chrome Manifest v3

Follows:
- TDD (Test-Driven Development)
- ISP (Interface Segregation Principle)
- SOLID principles
- Event-driven architecture

---

**Ready to expose browser state to AI!** 🚀

[Get Started](./QUICKSTART.md) | [Documentation](./START_HERE.md) | [Report Issue](https://github.com/yourusername/browser-mcp/issues)
