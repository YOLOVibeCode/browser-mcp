# Browser MCP v4.0.4 - Setup Instructions

## 🚀 Quick Start (2 Steps)

### Step 1: Start MCP Server

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server
node index.js
```

**Expected Output:**
```
{"timestamp":"...","component":"MCPServer","message":"Starting Browser MCP Server","version":"4.0.4","port":8765}
[...] [WebSocketServerHost] WebSocket server listening on ws://localhost:8765
{"timestamp":"...","component":"MCPServer","message":"Server started"}
{"timestamp":"...","component":"MCPServer","message":"Waiting for Chrome Extension to connect..."}
```

✅ **Success:** You should see "WebSocket server listening on ws://localhost:8765"

### Step 2: Reload Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Find "**Browser MCP v4.0.3**"
3. Click the **RELOAD** button (circular arrow icon)
4. Version should update to **v4.0.4**
5. Click "**service worker**" link to open console

**Expected Console Output:**
```
[Browser MCP v4.0.3] Service worker starting...
[Browser MCP] Registering ALL 33 tools...
[Browser MCP] Registered 33 tools: Array(33)
[Browser MCP] Connecting to MCP server...
[WebSocketClient] Connecting to MCP server: ws://localhost:8765
[WebSocketClient] ✅ Connected to MCP server
[Browser MCP] Service worker initialized successfully! 🚀
```

✅ **Success:** You should see "✅ Connected to MCP server"

---

## 🔍 Verify Installation

Run the verification script:

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp
node test-websocket-direct.js
```

**Expected Output:**
```
==============================================
Direct WebSocket Connection Test
URL: ws://localhost:8765
==============================================
Testing connection...
✅ Connected to WebSocket server!
Connection successful after XXms
```

---

## 🧪 Run Tests

### Unit Tests Only
```bash
npm run test:unit
```

### E2E Tests (Extension Loading)
```bash
npm run test:e2e
```

### Full Integration Tests
```bash
# Terminal 1: Start MCP server
cd mcp-server && node index.js

# Terminal 2: Run integration tests
npm run test:integration
```

### Full Stack Test Script
```bash
./test-full-stack.sh
```

---

## 🐛 Troubleshooting

### Problem: "Extension not connecting"

**Check 1:** Is MCP server running?
```bash
lsof -i :8765 | grep LISTEN
```
Should show: `node ... TCP *:ultraseek-http (LISTEN)`

**Check 2:** Extension console errors?
1. Go to `chrome://extensions/`
2. Click "service worker" under Browser MCP
3. Look for red error messages

**Check 3:** Hard reload extension
1. Go to `chrome://extensions/`
2. Click "Remove" on Browser MCP
3. Click "Load unpacked"
4. Select `/Users/xcode/Documents/YOLOProjects/browser-mcp/browser-mcp-extension`
5. Verify version shows **4.0.4**

### Problem: "Port 8765 already in use"

Kill existing process:
```bash
lsof -ti:8765 | xargs kill -9
```

Then restart MCP server.

### Problem: "WebSocket connection failed"

**Check 1:** Firewall blocking localhost?
```bash
# Test if port is accessible
nc -zv localhost 8765
```

**Check 2:** MCP server crashed?
Check MCP server terminal for error messages.

**Check 3:** Extension version mismatch?
1. Verify extension shows **v4.0.4** in `chrome://extensions/`
2. If not, hard reload (remove + reinstall)

### Problem: "Old WebSocket server code still running"

**Symptom:** Console shows "Port 8765 busy" errors

**Fix:**
```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/browser-mcp-extension/background
ls -la websocket-server.js*

# Should see:
# websocket-server.js.backup  (old version)
# websocket-client.js         (new version)
```

If `websocket-server.js` exists (not `.backup`), you have old code. Run:
```bash
mv websocket-server.js websocket-server.js.backup
```

Then hard reload extension.

---

## 📋 Architecture Reference

### v4.0.4 Architecture (CURRENT)

```
┌──────────────────────────┐         ┌─────────────────────────┐
│   MCP Server             │         │  Chrome Extension       │
│   (Node.js)              │         │  (Service Worker)       │
│                          │         │                         │
│   WebSocket SERVER       │ ← conn  │  WebSocket CLIENT       │
│   Listens on :8765       │  ects   │  Connects to :8765      │
│   Uses 'ws' package      │         │  Uses native WebSocket  │
└──────────────────────────┘         └─────────────────────────┘
```

**Key Points:**
- ✅ MCP server **hosts** WebSocket server
- ✅ Extension **connects** as WebSocket client
- ✅ Works with Manifest V3 (no `chrome.sockets` required)
- ✅ Auto-reconnect if MCP server restarts

### Why This Works

The native browser `WebSocket` API **IS AVAILABLE** in MV3 service workers:

```javascript
// ✅ This works in MV3
const ws = new WebSocket('ws://localhost:8765');
```

But `chrome.sockets.tcpServer` API **IS NOT AVAILABLE**:

```javascript
// ❌ This does NOT work in MV3
chrome.sockets.tcpServer.create(...)
// Error: chrome.sockets.tcpServer is undefined
```

---

## 🎯 What Changed in v4.0.4

### Files Added
- `mcp-server/websocket-server-host.js` - WebSocket server implementation
- `browser-mcp-extension/background/websocket-client.js` - WebSocket client

### Files Removed/Backed Up
- `browser-mcp-extension/background/websocket-server.js` → `.backup`
- `browser-mcp-extension/background/websocket-server-test.js` (deleted)

### Files Modified
- `mcp-server/index.js` - Use WebSocketServerHost instead of WebSocketClient
- `browser-mcp-extension/background/service-worker.js` - Use WebSocketClient instead of WebSocketServer
- All `manifest.json` and `package.json` - Version bumped to 4.0.4

---

## ✅ Verification Checklist

- [ ] MCP server starts without errors
- [ ] Port 8765 shows LISTEN state
- [ ] Extension loads and shows v4.0.4
- [ ] Extension console shows "✅ Connected to MCP server"
- [ ] `test-websocket-direct.js` succeeds
- [ ] Unit tests pass
- [ ] E2E tests pass
- [ ] Integration tests pass

---

## 🔗 Next Steps

Once setup is complete:

1. **Test individual tools:**
   ```bash
   # Connect your IDE to browser-mcp-server
   # Try tools like:
   # - browser_get_console_logs
   # - browser_get_dom
   # - browser_evaluate_code
   ```

2. **Configure your IDE:**
   - Add `browser-mcp-server` to MCP settings
   - Test connection from AI assistant

3. **Start debugging:**
   - Open any webpage in Chrome
   - Use MCP tools via your AI assistant
   - All 33 tools should work!

---

**Status:** Ready for testing
**Version:** 4.0.4
**Date:** 2025-10-09

For detailed architecture changes, see [ARCHITECTURE_FIX_v4.0.4.md](ARCHITECTURE_FIX_v4.0.4.md)

