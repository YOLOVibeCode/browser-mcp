# Browser MCP Server

**WebSocket-based MCP Server for Browser MCP Chrome Extension**

Version: 4.0.0

## Overview

This is the Node.js MCP (Model Context Protocol) server that bridges IDEs (Claude Desktop, Cursor, Windsurf) to the Browser MCP Chrome Extension via WebSocket.

## Architecture

```
IDE (stdin/stdout)
    ↕ MCP Protocol (newline-delimited JSON)
MCP Server (this)
    ↕ WebSocket (ws://localhost:8765)
Chrome Extension
    ↕ Chrome DevTools Protocol
Browser Tabs (DOM, Network, Console, etc.)
```

## Installation

### From NPM (recommended)

```bash
npm install -g @yolovibecodeltd/browser-mcp-server
```

### From Source

```bash
cd mcp-server
npm install
npm link  # Makes 'browser-mcp-server' available globally
```

## Usage

### Start the server

```bash
browser-mcp-server
```

### With custom port

```bash
browser-mcp-server --port 9000
# or
BROWSER_MCP_PORT=9000 browser-mcp-server
```

### Configure your IDE

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-server"
    }
  }
}
```

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-server"
    }
  }
}
```

**Windsurf** (`~/.codeium/windsurf/mcp_config.json`):
```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-server"
    }
  }
}
```

## How It Works

1. **IDE starts the server** - When you start your IDE, it launches `browser-mcp-server`
2. **Server waits for extension** - Server starts and waits for Chrome Extension to connect
3. **Extension connects via WebSocket** - Chrome Extension connects to `ws://localhost:8765`
4. **Bidirectional communication** - Messages flow: IDE ↔ Server ↔ Extension

## Features

- ✅ **MCP Protocol** - Full JSON-RPC 2.0 support
- ✅ **Auto-reconnect** - Handles extension reloads gracefully
- ✅ **Message queueing** - Queues messages when extension is offline
- ✅ **Keepalive** - Maintains WebSocket connection
- ✅ **Cross-platform** - Works on macOS, Linux, Windows

## Components

- **index.js** - Main server orchestration
- **stdio-handler.js** - MCP protocol over stdin/stdout
- **websocket-client.js** - WebSocket connection to extension
- **message-queue.js** - Message queueing for offline handling

## Troubleshooting

### Extension not connected

**Error:**
```
Chrome Extension not connected. Make sure the extension is loaded.
```

**Solution:**
1. Load the Browser MCP extension in Chrome
2. Go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked"
5. Select the `browser-mcp-extension` folder

### Port already in use

**Error:**
```
WebSocket connection failed: EADDRINUSE
```

**Solution:**
```bash
# Use a different port
browser-mcp-server --port 9000
```

### Logs

All logs go to **stderr** (stdout is used for MCP protocol). To see logs:

```bash
# In your IDE, check the MCP server logs
# Claude Desktop: Check logs in ~/Library/Logs/Claude/
# Cursor: Check Output panel
```

## Development

### Run tests

```bash
npm test
```

### Manual testing

```bash
# Terminal 1: Start server
node index.js

# Terminal 2: Send test message
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | nc localhost 8765
```

## License

MIT

## Links

- GitHub: https://github.com/YOLOVibeCode/browser-mcp
- Issues: https://github.com/YOLOVibeCode/browser-mcp/issues
