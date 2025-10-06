# browser-mcp-companion

> Easy companion app for Browser MCP - Auto-starts MCP server for browser inspection with AI assistants

[![npm version](https://img.shields.io/npm/v/browser-mcp-companion.svg)](https://www.npmjs.com/package/browser-mcp-companion)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is Browser MCP?

Browser MCP exposes your browser state to AI assistants (like Claude Code, Claude Desktop, Cursor) via the Model Context Protocol. Inspect DOM, debug JavaScript, analyze network requests - all through natural language!

## What Does This Companion App Do?

This lightweight Node.js app:
- ✅ Starts the MCP server automatically (port 3100)
- ✅ Provides health check endpoint for Chrome extension
- ✅ Shows clear status in terminal
- ✅ Makes setup super simple!

## 🚀 Quick Start

### Install

```bash
npm install -g browser-mcp-companion
```

### Run

```bash
browser-mcp-companion
```

That's it! The server starts and opens a status page.

## 📦 Usage

### Option 1: Global Install (Recommended)

```bash
# Install globally
npm install -g browser-mcp-companion

# Run from anywhere
browser-mcp-companion
```

### Option 2: NPX (No Install)

```bash
# Run without installing
npx browser-mcp-companion
```

### Option 3: Local Project

```bash
# Add to your project
npm install browser-mcp-companion

# Run via package.json script
{
  "scripts": {
    "browser-mcp": "browser-mcp-companion"
  }
}
```

## 🎯 What Happens When You Run It?

1. **Health check server starts** on port 3100
2. **Status page opens** in your browser automatically
3. **Terminal shows** clear instructions
4. **Chrome extension can connect!**

## 🔌 Connect Your Browser

After starting the companion app:

1. Install the Browser MCP Chrome Extension
2. Navigate to any website
3. Click the extension icon
4. Click "Connect This Tab"

The extension will auto-detect the running companion app!

## 🤖 Use with AI Assistants

### Claude Code

The companion app works seamlessly with Claude Code. Once running, Claude can:
- Inspect your browser's DOM
- Read console logs
- Analyze network requests
- Detect JavaScript frameworks

### Claude Desktop / Cursor / Windsurf

See the [main repository](https://github.com/yourusername/browser-mcp) for IDE-specific setup.

## 📊 Features

- **Auto-start**: No manual server setup needed
- **Health checks**: Extension auto-detects running server
- **Status page**: Beautiful UI showing connection status
- **Graceful shutdown**: Ctrl+C to stop cleanly
- **Error handling**: Clear error messages and recovery

## 🐛 Troubleshooting

### Port 3100 already in use

```bash
# Find process using port 3100
lsof -i :3100

# Kill it
kill -9 <PID>

# Then restart
browser-mcp-companion
```

### Extension can't connect

1. Make sure companion app is running
2. Check status page at http://localhost:3100
3. Reload the Chrome extension

## 📝 License

MIT © Browser MCP Contributors
