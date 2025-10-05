# Browser MCP Family

**Expose browser state to AI assistants via the Model Context Protocol**

[![Tests](https://img.shields.io/badge/tests-138%20passing-brightgreen)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3%2B-blue)]()
[![TDD](https://img.shields.io/badge/methodology-TDD-orange)]()

---

## 🎉 Project Status

**✅ FULLY FUNCTIONAL** - All core infrastructure implemented with **138/138 tests passing**

- ✅ Event-driven architecture
- ✅ Port management with real binding
- ✅ Tab lifecycle management
- ✅ Framework detection (React, Vue, Angular, jQuery)
- ✅ Chrome DevTools Protocol integration
- ✅ MCP Server with stdio transport
- ✅ Virtual filesystem for browser state
- ✅ Chrome Extension (Manifest v3)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Tests

```bash
npm test -- --run
```

All 138 tests should pass!

### 3. Build All Packages

```bash
npm run build
```

### 4. Load Chrome Extension

1. Open `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked"
4. Select `extension-chromium/dist/` folder

###  5. Configure Claude Desktop

Copy `claude_desktop_config.json` to your Claude Desktop configuration directory:

**macOS:**
```bash
mkdir -p ~/Library/Application\ Support/Claude/
cp claude_desktop_config.json ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

**Update the path** in the config file to match your local installation.

### 6. Restart Claude Desktop

The Browser MCP Server will now be available in Claude Desktop!

---

## 📦 Architecture

### Packages

```
browser-mcp/
├── contracts/              # Interface definitions (v1.0.0)
├── infrastructure/         # Real implementations
├── extension-chromium/     # Chrome extension
├── mcp-server/             # MCP server entry point
└── test-harnesses/         # Testing with real browsers
```

### Key Components

**1. Event Bus** (8 tests ✅)
- EventEmitter3 wrapper
- Type-safe event emission

**2. Port Manager** (17 tests ✅)
- Real port binding with Node.js `net`
- Smart allocation (3100-3199)

**3. Tab Manager** (22 tests ✅)
- Tab lifecycle management
- Virtual filesystem URI generation

**4. Framework Detector** (21 tests ✅)
- Detects React, Vue, Angular, jQuery
- Multiple detection methods
- Real browser testing

**5. CDP Adapter** (15 tests ✅)
- Chrome DevTools Protocol
- Real browser communication

**6. MCP Server** (19 tests ✅)
- Resources, tools, prompts
- stdio transport

**7. Virtual Filesystem** (15 tests ✅)
- Browser state mapping
- JSON-RPC resource providers

**8. Stdio Transport** (10 tests ✅)
- JSON-RPC 2.0
- Claude Desktop integration

---

## 🎯 Features

### Resources (Virtual Filesystem)

The MCP server exposes browser state as virtual resources:

- `browser://tab-{host}/dom/html` - Live HTML content
- `browser://tab-{host}/console/logs` - Console messages
- `browser://tab-{host}/network/requests` - Network activity
- `browser://tab-{host}/metadata/frameworks` - Detected frameworks

### Tools

- `listActiveTabs` - List all active browser tabs
- `getTabInfo` - Get information about a specific tab

### Prompts

- `analyzeTab` - Generate prompt to analyze tab content

---

## 🧪 Testing Philosophy

### TDD (Test-Driven Development)
- All code written tests-first
- RED → GREEN → REFACTOR cycle
- 138/138 tests passing

### Real Implementations (NO MOCKS)
- ✅ Real EventEmitter3
- ✅ Real port binding
- ✅ Real Chromium via Playwright
- ✅ Real CDP communication
- ✅ Real framework detection

### ISP (Interface Segregation Principle)
- All interfaces in `contracts/` package
- Semantic versioning (v1.0.0)
- Zero runtime dependencies

---

## 📖 Usage Examples

### Test MCP Server Locally

```bash
cd mcp-server
npm start
```

Send JSON-RPC requests via stdin:

```json
{"jsonrpc":"2.0","id":1,"method":"initialize"}
{"jsonrpc":"2.0","id":2,"method":"resources/list"}
{"jsonrpc":"2.0","id":3,"method":"tools/list"}
```

### Activate a Tab

1. Click the extension icon in Chrome
2. Click "Activate Tab"
3. The extension will:
   - Allocate a port (3100-3199)
   - Register virtual filesystem resources
   - Emit `TabActivated` event

### Query from Claude Desktop

Once configured, ask Claude:

- "Show me the HTML content of the active tab"
- "List all console errors in the current page"
- "What JavaScript frameworks are detected?"

---

## 🏗️ Development

### Project Structure

```
contracts/src/
├── events/          # Event bus interfaces
├── mcp-server/      # MCP server interfaces
├── detection/       # Framework detection
├── cdp/             # Chrome DevTools Protocol
├── transport/       # JSON-RPC transport
├── virtual-fs/      # Virtual filesystem
└── types/           # Shared types

infrastructure/src/
├── event-bus/       # EventEmitter3 wrapper
├── port-management/ # Port allocation
├── tab-management/  # Tab lifecycle
├── detection/       # Framework detection
├── cdp/             # CDP adapter
├── mcp-server/      # MCP server core
├── transport/       # Stdio transport
└── virtual-fs/      # Virtual FS provider
```

### Add a New Tool

1. Update `mcp-server/src/index.ts`
2. Register tool in `registerTools()` function
3. Implement tool logic
4. Write tests

### Add a New Resource

1. Update `VirtualFilesystemProvider.ts`
2. Add new resource in `createResourcesForTab()`
3. Add setter method
4. Write tests

---

## 🎓 Architecture Principles

### 1. Event-Driven
Components communicate via events:
```typescript
eventBus.emit('TabActivated', { tabId, url, port });
```

### 2. Interface Segregation
```typescript
import type { ITabManager } from '@browser-mcp/contracts';
```

### 3. Dependency Injection
```typescript
const tabManager = new TabManager(eventBus);
```

### 4. Single Responsibility
Each component has one job:
- EventBus → Event communication
- PortManager → Port allocation
- TabManager → Tab lifecycle
- FrameworkDetector → Framework detection

---

## 🐛 Troubleshooting

### Extension not loading
- Check Chrome version (requires Manifest v3 support)
- Check console for errors
- Rebuild extension: `npm run build`

### MCP Server not connecting
- Check Claude Desktop config path
- Check Node.js version (requires 18+)
- Check server logs in Claude Desktop

### Tests failing
- Run `npm install` in all packages
- Check Playwright installation: `npx playwright install chromium`

---

## 📊 Test Coverage

| Component | Unit Tests | Integration Tests | Total |
|-----------|-----------|-------------------|-------|
| EventEmitterBus | 8 | 0 | 8 |
| PortManager | 17 | 0 | 17 |
| TabManager | 22 | 0 | 22 |
| FrameworkDetector | 17 | 4 | 21 |
| ChromeTestInstance | 11 | 0 | 11 |
| CDPAdapter | 15 | 0 | 15 |
| MCPServer | 19 | 0 | 19 |
| StdioTransport | 10 | 0 | 10 |
| VirtualFilesystem | 15 | 0 | 15 |
| **TOTAL** | **134** | **4** | **138** |

---

## 🤝 Contributing

This project follows TDD methodology:

1. Write tests first (RED)
2. Implement to pass (GREEN)
3. Refactor (REFACTOR)
4. No mocks - use real implementations
5. Follow ISP - interfaces in `contracts/`

---

## 📝 License

MIT

---

## 🎊 Acknowledgments

Built with:
- TypeScript 5.3+
- Playwright (real browser testing)
- Vitest (fast unit testing)
- EventEmitter3
- Chrome Manifest v3

Follows principles:
- TDD (Test-Driven Development)
- ISP (Interface Segregation Principle)
- SOLID principles
- Event-driven architecture

---

**Ready to expose browser state to AI!** 🚀
