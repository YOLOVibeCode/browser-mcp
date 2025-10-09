# WebSocket Server Fix Plan

**Date:** October 9, 2025  
**Issue:** chrome.sockets.tcpServer API not working  
**Status:** 🔴 CRITICAL - Blocking all functionality

---

## Problem Statement

The Chrome extension attempts to create a WebSocket server using `chrome.sockets.tcpServer` API, but:
- ✅ API call is made
- ❌ Server never starts
- ❌ Port 8765 never opens
- ❌ No visible errors in console

### Test Results

```bash
$ node test-websocket-direct.js
❌ CONNECTION ERROR: connect ECONNREFUSED 127.0.0.1:8765
```

### Root Cause

**`chrome.sockets` API status in Manifest V3:**
- The API exists but may have restrictions
- May not work in service workers
- May require additional permissions
- May not work in Playwright test environment

---

## Investigation Steps

### Step 1: Test in Real Chrome (IMMEDIATE)

Before changing architecture, test if API works in production Chrome:

```bash
# 1. Load extension in real Chrome (not Playwright)
open -a "Google Chrome" chrome://extensions/

# 2. Enable Developer mode
# 3. Click "Load unpacked"
# 4. Select: /Users/xcode/Documents/YOLOProjects/browser-mcp/browser-mcp-extension

# 5. Click "service worker" link

# 6. Check console for:
✓ [WebSocketServer] ✓ chrome.sockets API available
✓ [WebSocketServer] ✓ TCP server socket created: X
✓ [WebSocketServer] ✓ Successfully listening on 127.0.0.1:8765

# 7. Test connection
node test-websocket-direct.js
```

**Expected outcomes:**
- **A) Works in real Chrome** → Playwright test environment issue, not code issue
- **B) Fails in real Chrome** → chrome.sockets API not available, need alternative

---

## Solution Options

### Option A: Fix chrome.sockets Implementation (if API works)

**If test in real Chrome succeeds:**

The API works, but Playwright environment doesn't support it.

**Fix:**
1. Keep WebSocket server implementation
2. Skip WebSocket integration tests in Playwright
3. Add manual test instructions
4. Document limitation

**Pros:**
- No architecture change
- Existing code works in production
- Simple fix

**Cons:**
- Can't fully automate integration tests
- Less confidence in changes

---

### Option B: Use External WebSocket Server (RECOMMENDED IF API FAILS)

**If test in real Chrome fails:**

The chrome.sockets API doesn't work in Manifest V3 service workers.

**Architecture Change:**

```
CURRENT (BROKEN):
IDE → MCP Server → WebSocket CLIENT → Extension WebSocket SERVER ❌

NEW (WORKING):
IDE → MCP Server WITH WebSocket SERVER → Extension WebSocket CLIENT ✅
```

**Implementation:**

1. **Move WebSocket SERVER to MCP Server** (Node.js)
   ```javascript
   // mcp-server/index.js
   const WebSocketServer = require('ws').Server;
   const wss = new WebSocketServer({ port: 8765 });
   
   wss.on('connection', (ws) => {
     // Handle messages from extension
   });
   ```

2. **Make Extension a WebSocket CLIENT**
   ```javascript
   // browser-mcp-extension/background/service-worker.js
   const ws = new WebSocket('ws://localhost:8765');
   
   ws.onopen = () => {
     console.log('Connected to MCP server');
   };
   ```

3. **Connection Flow:**
   ```
   1. User starts MCP server
   2. MCP server starts WebSocket server on :8765
   3. Extension connects to MCP server
   4. IDE ← MCP Server ← Extension ← Chrome
   ```

**Pros:**
- ✅ Uses standard WebSocket API (always works)
- ✅ No chrome.sockets dependency
- ✅ Fully testable with Playwright
- ✅ More reliable
- ✅ Easier debugging

**Cons:**
- Requires architecture change
- Extension must connect (not listen)
- MCP server must start first

---

### Option C: Native Messaging (ALTERNATIVE)

Use Chrome's Native Messaging instead of WebSockets.

**Architecture:**
```
IDE → MCP Server → Native Messaging Host → Extension
```

**Pros:**
- Official Chrome API
- Guaranteed to work
- No network ports needed

**Cons:**
- Requires native host installation
- More complex setup
- Less flexible

---

## Recommended Solution

### Path Forward:

**IMMEDIATE (Today):**
1. ✅ Test in real Chrome
2. ✅ If works → Document Playwright limitation
3. ✅ If fails → Implement Option B (flip WebSocket architecture)

**Option B Implementation (2-4 hours):**

1. **Update MCP Server to host WebSocket server:**
   ```javascript
   // mcp-server/websocket-server-host.js
   const { WebSocketServer } = require('ws');
   
   class MCPWebSocketServer {
     constructor(port = 8765) {
       this.wss = new WebSocketServer({ port });
       this.extensionConnection = null;
       
       this.wss.on('connection', (ws) => {
         console.log('Extension connected');
         this.extensionConnection = ws;
         
         ws.on('message', (data) => {
           this.handleExtensionMessage(JSON.parse(data));
         });
       });
     }
     
     sendToExtension(message) {
       if (this.extensionConnection) {
         this.extensionConnection.send(JSON.stringify(message));
       }
     }
   }
   ```

2. **Update Extension to be WebSocket client:**
   ```javascript
   // browser-mcp-extension/background/websocket-client.js
   export class WebSocketClient {
     constructor(url = 'ws://localhost:8765') {
       this.url = url;
       this.ws = null;
       this.connect();
     }
     
     connect() {
       this.ws = new WebSocket(this.url);
       
       this.ws.onopen = () => {
         console.log('[Extension] Connected to MCP server');
       };
       
       this.ws.onmessage = (event) => {
         const message = JSON.parse(event.data);
         this.handleMessage(message);
       };
       
       this.ws.onclose = () => {
         console.log('[Extension] Disconnected, reconnecting...');
         setTimeout(() => this.connect(), 2000);
       };
     }
     
     send(message) {
       if (this.ws?.readyState === WebSocket.OPEN) {
         this.ws.send(JSON.stringify(message));
       }
     }
   }
   ```

3. **Update service-worker.js:**
   ```javascript
   import { WebSocketClient } from './websocket-client.js';
   
   const wsClient = new WebSocketClient();
   
   // When tool is called
   async function executeTool(toolName, args) {
     const response = await someToolLogic();
     wsClient.send(response);
   }
   ```

**Files to modify:**
- `mcp-server/index.js` - Add WebSocket server
- `browser-mcp-extension/background/service-worker.js` - Use WebSocket client
- `browser-mcp-extension/background/websocket-server.js` - Delete or rename
- `browser-mcp-extension/background/websocket-client.js` - Create new

**Testing:**
1. Start MCP server (WebSocket server starts)
2. Load extension (connects as client)
3. Run integration tests (all should pass)

---

## Decision Point

**STOP HERE - Test in Real Chrome First**

```bash
# Run this command:
open -a "Google Chrome" chrome://extensions/

# Load unpacked extension
# Check service worker console
# Run: node test-websocket-direct.js
```

**Results will determine next steps:**
- ✅ **Works** → Document limitation, ship as-is
- ❌ **Fails** → Implement Option B (flip architecture)

---

## Timeline

- **Investigation:** 30 minutes ← WE ARE HERE
- **Option A (works):** 1 hour documentation
- **Option B (flip):** 4 hours implementation + 2 hours testing
- **Option C (native):** 8+ hours

---

**Next Action:** Test in real Chrome browser NOW

