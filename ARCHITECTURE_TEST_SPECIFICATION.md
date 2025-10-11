# Browser MCP - Complete Architecture & Test Specification
**Version:** 4.0.7  
**Date:** 2025-10-09  
**Status:** COMPREHENSIVE SPECIFICATION FOR AI-ACCESSIBLE MCP SERVER

---

## 🎯 Executive Summary

This document provides a **complete specification** for testing and validating the Browser MCP system as a production-ready Model Context Protocol (MCP) server that **ANY AI assistant** can reliably use to control and inspect browser state via WebSocket communication.

### Critical Success Criteria
- ✅ **WebSocket Architecture** - Reliable bidirectional communication
- ✅ **MCP Protocol Compliance** - JSON-RPC 2.0 + MCP extensions
- ✅ **33 Tools Validated** - Each tool tested for correctness
- ✅ **AI Client Compatibility** - Works with Claude, Cursor, Windsurf
- ✅ **Production Reliability** - Auto-reconnect, error handling, performance

---

## 📋 Table of Contents

1. [System Architecture](#1-system-architecture)
2. [Interface Contracts](#2-interface-contracts)
3. [Message Flow Specifications](#3-message-flow-specifications)
4. [WebSocket Protocol Requirements](#4-websocket-protocol-requirements)
5. [MCP Protocol Requirements](#5-mcp-protocol-requirements)
6. [Tool Catalog & Specifications](#6-tool-catalog--specifications)
7. [Error Handling Requirements](#7-error-handling-requirements)
8. [Performance Requirements](#8-performance-requirements)
9. [Security Requirements](#9-security-requirements)
10. [Test Strategy](#10-test-strategy)
11. [Test Implementation Checklist](#11-test-implementation-checklist)
12. [Quality Gates](#12-quality-gates)
13. [Deployment Checklist](#13-deployment-checklist)

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│ AI ASSISTANT (Claude Desktop, Cursor, Windsurf)                 │
│ ─────────────────────────────────────────────────────────────── │
│ • Sends MCP requests (tools/list, tools/call)                   │
│ • Receives structured responses                                  │
│ • Interprets browser state for user                             │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ stdio (newline-delimited JSON-RPC 2.0)
                         │ • stdin: IDE → Server
                         │ • stdout: Server → IDE
                         │ • stderr: Logs (diagnostic)
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│ MCP SERVER (Node.js - mcp-server/index.js)                      │
│ ─────────────────────────────────────────────────────────────── │
│ Components:                                                       │
│ • StdioHandler - Parses stdin/stdout                            │
│ • WebSocketServerHost - Hosts WS server (port 8765)            │
│ • MessageQueue - Buffers when extension offline                 │
│                                                                   │
│ Responsibilities:                                                 │
│ • Translate MCP ↔ Extension protocol                            │
│ • Handle initialize, tools/list, tools/call                     │
│ • Queue messages when extension disconnected                     │
│ • Route responses back to IDE                                    │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ WebSocket (ws://localhost:8765)
                         │ • Binary/Text frames (RFC 6455)
                         │ • JSON-RPC 2.0 payloads
                         │ • Keepalive pings
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│ CHROME EXTENSION (Manifest V3 Service Worker)                   │
│ ─────────────────────────────────────────────────────────────── │
│ Components:                                                       │
│ • WebSocketClient - Connects to localhost:8765                  │
│ • MCPServer - JSON-RPC handler                                   │
│ • TabManager - Tracks open tabs                                  │
│ • ChromeCDP - DevTools Protocol adapter                          │
│ • 33 Tools - All browser inspection capabilities                │
│                                                                   │
│ Responsibilities:                                                 │
│ • Maintain WebSocket connection                                  │
│ • Execute tool calls                                             │
│ • Return structured responses                                    │
│ • Handle Chrome API errors                                       │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ Chrome DevTools Protocol (CDP)
                         │ • chrome.debugger.attach()
                         │ • chrome.debugger.sendCommand()
                         │ • Runtime, DOM, Network, Console domains
                         ↓
┌──────────────────────────────────────────────────────────────────┐
│ BROWSER TABS (Chrome Renderer)                                   │
│ ─────────────────────────────────────────────────────────────── │
│ • DOM manipulation & inspection                                  │
│ • JavaScript evaluation                                          │
│ • Console log capture                                            │
│ • Network request monitoring                                     │
│ • Storage access (localStorage, IndexedDB, etc.)                │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Architecture Decisions

| Decision | Rationale | Tradeoff |
|----------|-----------|----------|
| **MCP Server hosts WebSocket** | Manifest V3 lacks chrome.sockets API | Extension must be running first |
| **Native WebSocket in extension** | Available in MV3 service workers | Standard browser API only |
| **Port 8765 default** | Common dev port, configurable | Requires free port |
| **Auto-reconnect in extension** | Handles server restarts gracefully | Infinite retry by default |
| **Message queueing** | Buffers IDE requests when offline | Max 100 messages (configurable) |
| **Newline-delimited JSON** | MCP spec requirement | No streaming within message |
| **stderr for logs** | stdout reserved for protocol | IDE won't see internal logs |

### 1.3 Key Components

#### MCP Server (Node.js)
**File:** `mcp-server/index.js`  
**Dependencies:** `ws@^8.16.0`  
**Entry Point:** `bin/browser-mcp-server`

**Interfaces:**
```typescript
interface IMCPServer {
  start(): Promise<void>
  handleIDEMessage(message: MCPRequest): Promise<void>
  flushQueue(): Promise<void>
}
```

#### WebSocket Server Host
**File:** `mcp-server/websocket-server-host.js`  
**Port:** 8765 (configurable via BROWSER_MCP_PORT)

**Interfaces:**
```typescript
interface IWebSocketServerHost extends EventEmitter {
  start(): Promise<void>
  send(message: object): void
  sendAndWait(message: object, timeout?: number): Promise<object>
  isConnected(): boolean
  stop(): void
}
```

#### Chrome Extension
**File:** `browser-mcp-extension/background/service-worker.js`  
**Manifest:** V3 (Chrome 90+)

**Interfaces:**
```typescript
interface IExtension {
  mcpServer: IMCPServer
  tabManager: ITabManager
  cdp: IChromeCDP
  wsClient: IWebSocketClient
}
```

---

## 2. Interface Contracts

### 2.1 WebSocket Message Envelope

All messages MUST conform to JSON-RPC 2.0:

```typescript
interface JSONRPCRequest {
  jsonrpc: "2.0"
  id: number | string | null
  method: string
  params?: object | array
}

interface JSONRPCResponse {
  jsonrpc: "2.0"
  id: number | string | null
  result?: any
  error?: JSONRPCError
}

interface JSONRPCError {
  code: number
  message: string
  data?: any
}
```

**Constraints:**
- Text frames only (UTF-8 encoding)
- Maximum payload: 256 KB (enforced)
- One message per frame (no fragmentation)
- `id` correlation required for requests
- `id: null` for notifications

### 2.2 MCP Protocol Methods

#### initialize
**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "initialize",
  "params": {
    "protocolVersion": "2024-11-05",
    "capabilities": {},
    "clientInfo": {
      "name": "claude-desktop",
      "version": "1.0.0"
    }
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "protocolVersion": "2024-11-05",
    "serverInfo": {
      "name": "browser-mcp",
      "version": "4.0.7"
    },
    "capabilities": {
      "tools": {}
    }
  }
}
```

#### tools/list
**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/list"
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "tools": [
      {
        "name": "listTabs",
        "description": "List all open browser tabs",
        "inputSchema": {
          "type": "object",
          "properties": {
            "filter": { "type": "string" }
          }
        }
      }
      // ... 32 more tools
    ]
  }
}
```

#### tools/call
**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "listTabs",
    "arguments": {}
  }
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "result": {
    "tabs": [
      {
        "tabId": 123,
        "url": "https://example.com",
        "registeredAt": "2025-10-09T12:00:00Z"
      }
    ],
    "totalCount": 1
  }
}
```

### 2.3 Error Codes

**JSON-RPC Standard:**
| Code | Meaning | Usage |
|------|---------|-------|
| -32700 | Parse error | Invalid JSON |
| -32600 | Invalid Request | Missing jsonrpc/method |
| -32601 | Method not found | Unknown method |
| -32602 | Invalid params | Missing required params |
| -32603 | Internal error | Tool execution failed |

**Custom Codes:**
| Code | Meaning | Usage |
|------|---------|-------|
| -32000 | Extension offline | WebSocket not connected |
| -32001 | Timeout | No response in 30s |
| -32002 | Tool error | Chrome API error |

---

## 3. Message Flow Specifications

### 3.1 Successful Tool Call Flow

```
IDE                MCP Server              Extension              Browser
 │                      │                       │                     │
 │  tools/call          │                       │                     │
 │─────────────────────>│                       │                     │
 │  (stdin)             │                       │                     │
 │                      │  Forward via WS       │                     │
 │                      │──────────────────────>│                     │
 │                      │  {method:tools/call}  │                     │
 │                      │                       │  chrome.debugger    │
 │                      │                       │────────────────────>│
 │                      │                       │  attach + sendCmd   │
 │                      │                       │                     │
 │                      │                       │<────────────────────│
 │                      │                       │  CDP response       │
 │                      │  Response via WS      │                     │
 │                      │<──────────────────────│                     │
 │  Response            │  {result: {...}}      │                     │
 │<─────────────────────│                       │                     │
 │  (stdout)            │                       │                     │
```

**Timing Requirements:**
- Request → Response: < 5s (95th percentile)
- WebSocket send → receive: < 100ms
- Chrome CDP command: < 500ms
- Total end-to-end: < 6s

### 3.2 Extension Offline Flow

```
IDE                MCP Server              Extension
 │                      │                       │
 │  tools/call          │                       │
 │─────────────────────>│                       X (disconnected)
 │                      │                       
 │                      │ Check connection      
 │                      │ → Not connected       
 │                      │                       
 │                      │ Queue message         
 │                      │ (MessageQueue.add)    
 │                      │                       
 │  Error Response      │                       
 │<─────────────────────│                       
 │  code: -32000        │                       
 │  "Extension offline" │                       
```

### 3.3 Reconnection Flow

```
Extension           MCP Server
    │                   │
    │  Disconnect       │
    X<──────────────────│
                        │
    │  (2s delay)       │
    │                   │
    │  Reconnect        │
    │──────────────────>│
    │  WebSocket open   │
    │                   │
    │<──────────────────│
    │  Connected        │
    │                   │
    │                   │ Flush queue
    │<──────────────────│
    │  Queued messages  │
```

**Reconnection Policy:**
- Initial delay: 2 seconds
- Max attempts: Infinity (configurable)
- Backoff: None (constant delay)
- Queue flush: Automatic on connect

---

## 4. WebSocket Protocol Requirements

### 4.1 Connection Establishment

**Server Side (mcp-server/websocket-server-host.js):**
```javascript
// MUST bind to localhost only (security)
const wss = new WebSocketServer({ 
  host: '127.0.0.1',
  port: 8765 
});

// MUST log connection events
wss.on('connection', (ws, req) => {
  console.error(`Extension connected from: ${req.socket.remoteAddress}`);
});
```

**Client Side (browser-mcp-extension/background/websocket-client.js):**
```javascript
// MUST use native WebSocket API
const ws = new WebSocket('ws://localhost:8765');

// MUST handle all events
ws.onopen = () => { /* connected */ };
ws.onmessage = (event) => { /* handle message */ };
ws.onerror = (error) => { /* log error */ };
ws.onclose = () => { /* schedule reconnect */ };
```

### 4.2 Keepalive Requirements

**Purpose:** Detect stale connections

**Implementation:**
- Extension sends ping every 20 seconds
- Server auto-responds with pong (ws library)
- 3 missed pongs → assume dead, reconnect

**Client Code:**
```javascript
startPing() {
  this.pingInterval = setInterval(() => {
    if (this.isConnected()) {
      // WebSocket ping/pong handled by browser
      console.log('[WebSocketClient] Connection alive');
    }
  }, 20000);
}
```

### 4.3 Message Size Limits

| Limit | Value | Enforcement |
|-------|-------|-------------|
| Max frame size | 256 KB | Extension enforces before send |
| Max message queue | 100 messages | Server enforces |
| Max queued size | 10 MB | Server enforces |

**Oversized Message Handling:**
```javascript
if (JSON.stringify(message).length > 256 * 1024) {
  throw new Error('Message exceeds 256KB limit');
}
```

### 4.4 Frame Format

**Text Frames Only:**
- Opcode: 0x01 (text)
- Masking: Required (client → server)
- Encoding: UTF-8
- Payload: JSON string

**Fragmentation:**
- Not supported
- Single frame per message
- MUST be complete JSON object

---

## 5. MCP Protocol Requirements

### 5.1 Protocol Version

**Current:** `2024-11-05`  
**Supported:** `2024-11-05` only

**Version Negotiation:**
```json
// IDE sends
{
  "method": "initialize",
  "params": { "protocolVersion": "2024-11-05" }
}

// Server responds
{
  "result": { "protocolVersion": "2024-11-05" }
}

// If version mismatch
{
  "error": {
    "code": -32602,
    "message": "Unsupported protocol version"
  }
}
```

### 5.2 Stdio Format

**Input (stdin):**
- Newline-delimited JSON
- One message per line
- No blank lines
- UTF-8 encoding

**Output (stdout):**
- Newline-delimited JSON
- One response per line
- MUST match request ID
- UTF-8 encoding

**Logging (stderr):**
- JSON structured logs
- Timestamp included
- Does NOT affect protocol

**Example Session:**
```bash
# stdin (IDE → Server)
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}

# stdout (Server → IDE)
{"jsonrpc":"2.0","id":1,"result":{"protocolVersion":"2024-11-05"}}

# stderr (Server logging)
{"timestamp":"2025-10-09T12:00:00Z","message":"Received initialize"}
```

### 5.3 Request/Response Correlation

**ID Requirements:**
- MUST be unique within session
- MUST be number or string
- MUST be returned in response
- `null` for notifications (no response expected)

**Timeout Handling:**
```javascript
// Server: 30-second timeout
sendAndWait(message, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Request ${message.id} timed out`));
    }, timeout);
    
    this.pendingRequests.set(message.id, { resolve, reject });
    this.send(message);
  });
}
```

---

## 6. Tool Catalog & Specifications

### 6.1 Complete Tool List (33 Tools)

#### Console Tools (2)
1. **getConsole** - Get console messages from tab
2. **clearConsole** - Clear console messages

#### DOM Tools (3)
3. **getDOM** - Get complete DOM structure
4. **querySelector** - Query DOM elements (single)
5. **getAttributes** - Get element attributes

#### Network Tools (2)
6. **getNetwork** - Get network requests
7. **getFailedRequests** - Get failed network requests

#### Tab Tools (2)
8. **listTabs** - List all open tabs
9. **getTabInfo** - Get specific tab information

#### Evaluate Tools (2)
10. **evaluateCode** - Execute JavaScript in page
11. **getPageTitle** - Get page title

#### CSS Tools (3)
12. **getCSSStyles** - Get computed CSS styles
13. **findCSSRule** - Find CSS rules
14. **getElementClasses** - Get element classes

#### Storage Tools (5)
15. **getAllStorage** - Get all storage types
16. **getLocalStorage** - Get localStorage
17. **getSessionStorage** - Get sessionStorage
18. **getIndexedDB** - Get IndexedDB data
19. **getCookies** - Get cookies

#### Query Tools (4)
20. **queryDOM** - Advanced DOM queries (multiple)
21. **findByText** - Find elements by text content
22. **getSiblings** - Get sibling elements
23. **getParents** - Get parent elements

#### Framework Tools (3)
24. **detectFramework** - Detect JS framework
25. **getComponentSource** - Get component source
26. **getComponentTree** - Get component tree

#### Debug Tools (3)
27. **getComponentState** - Get component state
28. **getRenderChain** - Get render chain
29. **traceDataSources** - Trace data sources

#### Sourcemap Tools (4)
30. **listScripts** - List loaded scripts
31. **getSourceMap** - Get source map
32. **compareSource** - Compare deployed vs source
33. **resolveSourceLocation** - Resolve source location

### 6.2 Tool Interface Specification

**Every tool MUST implement:**
```typescript
interface IMCPTool {
  name: string
  description: string
  inputSchema: JSONSchema
  execute: (params: object) => Promise<object>
}
```

**JSON Schema Format:**
```json
{
  "type": "object",
  "properties": {
    "urlPattern": {
      "type": "string",
      "description": "URL pattern to match tabs"
    }
  },
  "required": ["urlPattern"]
}
```

### 6.3 Tool Execution Contract

**Input Validation:**
- Extension MUST validate params against inputSchema
- Missing required params → Error -32602
- Invalid type → Error -32602

**Output Format:**
- MUST return JSON-serializable object
- MUST NOT throw exceptions (catch and return error)
- MUST include diagnostic info on error

**Example Tool:**
```javascript
export function createListTabsTool(tabManager) {
  return {
    name: 'listTabs',
    description: 'List all open browser tabs',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Optional URL filter' }
      }
    },
    
    execute: async (params) => {
      try {
        const { filter } = params;
        let tabs = tabManager.getAllTabs();
        
        if (filter) {
          tabs = tabs.filter(t => t.url.includes(filter));
        }
        
        return {
          tabs: tabs.map(t => ({
            tabId: t.tabId,
            url: t.url,
            registeredAt: t.registeredAt
          })),
          totalCount: tabs.length
        };
      } catch (error) {
        return {
          error: error.message,
          availableTabs: tabManager.getAllTabs().map(t => t.url)
        };
      }
    }
  };
}
```

### 6.4 Chrome DevTools Protocol (CDP) Usage

**Common Domains:**
- `Runtime` - JavaScript evaluation
- `DOM` - DOM inspection
- `Network` - Network monitoring
- `Console` - Console logs
- `Debugger` - Source mapping

**Attach Requirements:**
```javascript
// MUST attach before sending commands
await chrome.debugger.attach({ tabId }, '1.3');

// MUST enable domain
await chrome.debugger.sendCommand({ tabId }, 'Runtime.enable', {});

// MUST handle errors
if (chrome.runtime.lastError) {
  throw new Error(chrome.runtime.lastError.message);
}

// MUST detach when done (optional, auto-detaches on tab close)
await chrome.debugger.detach({ tabId });
```

---

## 7. Error Handling Requirements

### 7.1 Error Propagation Chain

```
Browser Error (CDP)
    ↓
ChromeCDP catches
    ↓
Tool returns error object
    ↓
MCPServer wraps in JSON-RPC error
    ↓
WebSocket sends to MCP Server
    ↓
MCP Server forwards to IDE
    ↓
IDE displays to user
```

### 7.2 Error Response Format

**At Tool Level:**
```javascript
// Tool MUST return error object, NOT throw
return {
  error: 'Tab not found',
  tabId: requestedTabId,
  availableTabs: [123, 456]
};
```

**At MCP Level:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "error": {
    "code": -32603,
    "message": "Tool execution failed",
    "data": {
      "tool": "listTabs",
      "error": "Tab not found",
      "tabId": 999,
      "availableTabs": [123, 456]
    }
  }
}
```

### 7.3 Retry Policy

**Automatic Retries:**
- WebSocket connection: Yes (infinite)
- Tool execution: No
- CDP commands: No

**IDE Should Retry:**
- Extension offline (-32000)
- Timeout (-32001)
- Internal error (-32603) with transient cause

**IDE Should NOT Retry:**
- Invalid params (-32602)
- Method not found (-32601)
- Tool-specific errors

---

## 8. Performance Requirements

### 8.1 Latency Targets

| Operation | Target | Acceptable | Failure |
|-----------|--------|------------|---------|
| WebSocket round-trip | < 50ms | < 200ms | > 500ms |
| CDP command | < 200ms | < 1s | > 3s |
| Tool execution | < 1s | < 5s | > 10s |
| Full request cycle | < 2s | < 6s | > 15s |
| Reconnection | < 2s | < 5s | > 10s |

### 8.2 Throughput Targets

| Metric | Target | Notes |
|--------|--------|-------|
| Concurrent requests | 10 | Per IDE connection |
| Requests per second | 50 | Burst rate |
| Sustained RPS | 10 | Long-term average |
| Tools per IDE | 33 | Fixed |

### 8.3 Resource Limits

| Resource | Limit | Enforcement |
|----------|-------|-------------|
| Extension memory | < 100 MB | Chrome enforces |
| Server memory | < 100 MB | Monitor RSS |
| WebSocket connections | 1 | Single extension |
| Message queue size | 100 messages | Enforced |
| CDP attachments | 10 tabs | Practical limit |

### 8.4 Performance Monitoring

**Server MUST log:**
```javascript
{
  "timestamp": "2025-10-09T12:00:00Z",
  "component": "WebSocketServerHost",
  "message": "Request processed",
  "id": 123,
  "duration_ms": 456,
  "tool": "listTabs"
}
```

**Extension MUST log:**
```javascript
console.log('[Performance]', {
  tool: 'listTabs',
  cdpDuration: 123,
  totalDuration: 456,
  tabCount: 5
});
```

---

## 9. Security Requirements

### 9.1 Network Security

**MUST:**
- Bind to 127.0.0.1 ONLY (no 0.0.0.0)
- Use default port 8765 (configurable)
- No authentication (localhost trust model)
- No TLS (local-only communication)

**MUST NOT:**
- Accept remote connections
- Expose to network
- Store sensitive data

### 9.2 Chrome Extension Security

**Permissions Required:**
```json
{
  "permissions": [
    "debugger",    // CDP access
    "tabs",        // Tab management
    "storage",     // Storage access
    "activeTab",   // Active tab access
    "sockets"      // (legacy, not used)
  ],
  "host_permissions": [
    "<all_urls>"   // Access all sites
  ]
}
```

**Security Boundaries:**
- Extension runs in isolated context
- CDP requires explicit attach
- User sees debugger notification
- Extension can be disabled anytime

### 9.3 Code Execution Security

**evaluateCode tool:**
```javascript
// MUST execute in page context (not extension)
await cdp.sendCommand(tabId, 'Runtime.evaluate', {
  expression: userCode,
  returnByValue: true,
  userGesture: false
});

// MUST sanitize response
result = JSON.parse(JSON.stringify(result));
```

**Input Sanitization:**
- NO HTML injection
- NO SQL injection (no DB)
- JSON-only communication
- Chrome handles XSS

---

## 10. Test Strategy

### 10.1 Test Pyramid

```
       E2E (AI Integration)
       ──────────────────
      /                  \
     /  Integration Tests \
    /  (Full Stack Flow)  \
   /________________________\
  /                          \
 /      Unit Tests            \
/    (Component Isolation)     \
──────────────────────────────────
```

**Distribution:**
- Unit Tests: 70% of tests (fast feedback)
- Integration Tests: 25% (architecture validation)
- E2E Tests: 5% (user scenarios)

### 10.2 Test Levels

#### Level 1: Unit Tests
**Location:** `browser-mcp-extension/tests/*.test.js`  
**Runtime:** < 5 seconds  
**Isolation:** Mocked Chrome APIs

**Coverage:**
- TabManager (tab tracking)
- ChromeCDP (CDP commands)
- MCPServer (JSON-RPC handling)
- MessageQueue (buffering logic)
- DeltaCompression (optimization)
- MessageFilter (noise reduction)

#### Level 2: Component Tests
**Location:** `browser-mcp-extension/tests/*.e2e.spec.js`  
**Runtime:** ~40 seconds  
**Environment:** Real Chrome (Playwright)

**Coverage:**
- Extension loads correctly
- Service worker initializes
- Chrome APIs accessible
- JavaScript evaluation
- Console log capture
- DOM querying

#### Level 3: Integration Tests
**Location:** `tests/integration/*.e2e.spec.js`  
**Runtime:** ~2 minutes  
**Environment:** MCP Server + Extension + Chrome

**Coverage:**
- WebSocket server starts
- Extension connects
- Message routing
- Tool execution
- Error handling
- Reconnection logic

#### Level 4: E2E Tests
**Location:** `tests/e2e/*.spec.js`  
**Runtime:** ~5 minutes  
**Environment:** Full stack + IDE simulation

**Coverage:**
- stdio → WebSocket → CDP → Browser
- All 33 tools
- Multi-tool workflows
- Error scenarios
- Performance validation

### 10.3 Test Data Strategy

**Test Fixtures:**
```
tests/fixtures/
├── mcp-requests/
│   ├── initialize.json
│   ├── tools-list.json
│   └── tools-call-*.json
├── cdp-responses/
│   ├── runtime-evaluate.json
│   └── dom-querySelector.json
└── expected-outputs/
    ├── list-tabs.json
    └── get-console.json
```

**Test Pages:**
```
tests/pages/
├── simple.html          # Basic DOM
├── console-logs.html    # Console messages
├── network-test.html    # XHR/fetch
└── react-app.html       # Framework detection
```

### 10.4 CI/CD Integration

**GitHub Actions Workflow:**
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      
      - name: Install dependencies
        run: npm install
      
      - name: Unit tests
        run: npm run test:unit
      
      - name: Install Chrome
        run: npx playwright install chromium
      
      - name: Component tests
        run: npm run test:e2e
      
      - name: Integration tests
        run: npm run test:integration
      
      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results/
```

---

## 11. Test Implementation Checklist

### 11.1 Unit Tests (EXISTING ✅)

- [x] TabManager.registerTab()
- [x] TabManager.findTabs()
- [x] TabManager.getAllTabs()
- [x] ChromeCDP.sendCommand()
- [x] ChromeCDP.attach()
- [x] MCPServer.handleRequest()
- [x] MCPServer.registerTool()
- [x] MessageQueue.add()
- [x] MessageQueue.flush()
- [x] DeltaCompression
- [x] MessageFilter

**Status:** 90% coverage, all passing

### 11.2 Component Tests (EXISTING ✅)

- [x] Extension loads in Chrome
- [x] Service worker starts
- [x] Chrome tabs API accessible
- [x] JavaScript evaluation works
- [x] Console logs captured
- [x] DOM queries work
- [x] Multiple tabs managed
- [x] Extension persists
- [x] Page metadata accessible
- [ ] Popup UI loads (skipped - expected)

**Status:** 9/10 tests passing

### 11.3 Integration Tests (PARTIAL ⚠️)

**WebSocket Layer:**
- [x] Server starts on port 8765
- [x] Extension connects
- [x] Connection persists
- [x] Reconnection works
- [ ] Message routing (IDE → Extension)
- [ ] Response routing (Extension → IDE)
- [ ] Error propagation
- [ ] Queue flush on reconnect

**Status:** 4/8 tests passing (architecture verified)

### 11.4 Tool Validation Tests (MISSING ❌)

**For EACH of 33 tools:**
- [ ] Tool appears in tools/list
- [ ] Tool accepts valid params
- [ ] Tool rejects invalid params
- [ ] Tool returns correct schema
- [ ] Tool handles Chrome errors
- [ ] Tool performance < 5s

**Implementation Needed:**
```javascript
// tests/tools/all-tools.e2e.spec.js
describe('All 33 Tools Validation', () => {
  const tools = [
    'listTabs', 'getTabInfo', 'getConsole', // ... all 33
  ];
  
  test.each(tools)('Tool: %s', async (toolName) => {
    // 1. Call tools/list
    const list = await callMCP('tools/list');
    expect(list.tools.find(t => t.name === toolName)).toBeDefined();
    
    // 2. Get valid params
    const validParams = getValidParams(toolName);
    
    // 3. Call tool
    const result = await callMCP('tools/call', {
      name: toolName,
      arguments: validParams
    });
    
    // 4. Validate response
    expect(result.error).toBeUndefined();
    expect(result).toMatchSchema(toolSchemas[toolName]);
  });
});
```

### 11.5 Full Stack Tests (MISSING ❌)

**Scenarios:**
1. **Basic Flow**
   - [ ] Start server
   - [ ] Load extension
   - [ ] Call tools/list
   - [ ] Verify 33 tools
   - [ ] Call listTabs
   - [ ] Verify tabs returned

2. **Multi-Tool Workflow**
   - [ ] Open test page
   - [ ] Call listTabs → get tabId
   - [ ] Call evaluateCode → execute JS
   - [ ] Call getConsole → verify logs
   - [ ] Call getDOM → verify structure

3. **Error Handling**
   - [ ] Call with invalid tool name
   - [ ] Call with missing params
   - [ ] Call with invalid tabId
   - [ ] Kill extension mid-request
   - [ ] Verify timeout error

4. **Performance**
   - [ ] Measure tool execution time
   - [ ] Measure WebSocket latency
   - [ ] Measure full cycle time
   - [ ] Verify < 5s end-to-end

5. **Reconnection**
   - [ ] Disconnect extension
   - [ ] Send requests (queued)
   - [ ] Reconnect extension
   - [ ] Verify queue flushed
   - [ ] Verify responses received

**Implementation Needed:**
```javascript
// tests/integration/full-stack.e2e.spec.js
test('Full MCP Flow: IDE → Server → Extension → Browser', async () => {
  // 1. Start MCP server
  const server = await startMCPServer();
  
  // 2. Load extension with Playwright
  const context = await loadExtension();
  
  // 3. Wait for connection
  await waitForConnection(server, 5000);
  
  // 4. Simulate IDE request
  const request = {
    jsonrpc: '2.0',
    id: 1,
    method: 'tools/list'
  };
  
  // 5. Send via stdin
  server.stdin.write(JSON.stringify(request) + '\n');
  
  // 6. Read from stdout
  const response = await readStdout(server);
  
  // 7. Validate response
  expect(response.id).toBe(1);
  expect(response.result.tools.length).toBe(33);
});
```

### 11.6 AI Integration Tests (MANUAL ⏳)

**Manual Test Plan:**

1. **Claude Desktop**
   - [ ] Configure `claude_desktop_config.json`
   - [ ] Restart Claude
   - [ ] Verify tools appear
   - [ ] Ask: "What tabs are open?"
   - [ ] Verify listTabs called
   - [ ] Verify response correct

2. **Cursor IDE**
   - [ ] Configure `.cursor/mcp.json`
   - [ ] Restart Cursor
   - [ ] Verify tools appear
   - [ ] Ask: "Evaluate 2+2 in browser"
   - [ ] Verify evaluateCode called
   - [ ] Verify response correct

3. **Windsurf**
   - [ ] Configure `mcp_config.json`
   - [ ] Restart Windsurf
   - [ ] Verify tools appear
   - [ ] Test multi-step workflow

### 11.7 Installation Tests (MISSING ❌)

**Scripts to Test:**
- [ ] `scripts/setup-mcp.sh` (macOS/Linux)
- [ ] `scripts/setup-mcp.ps1` (Windows)
- [ ] `scripts/install-mcp.sh`
- [ ] `scripts/package-extension.sh`

**Test Cases:**
```bash
# Test setup script
./scripts/setup-mcp.sh --yes

# Verify installation
which browser-mcp-server
cat ~/.cursor/mcp.json | grep browser-mcp
test -f ~/browser-mcp-extension/manifest.json

# Test uninstall
npm uninstall -g @rvegajr/browser-mcp-server
rm -rf ~/browser-mcp-extension

# Verify clean
which browser-mcp-server  # Should fail
```

---

## 12. Quality Gates

### 12.1 Pre-Commit Gates

**Requirements:**
- [ ] All unit tests pass
- [ ] ESLint passes (if configured)
- [ ] No console.error in production code
- [ ] Version numbers consistent

**Command:**
```bash
npm run test:unit && npm run lint
```

### 12.2 Pre-Release Gates

**Requirements:**
- [ ] All unit tests pass (100%)
- [ ] Component tests pass (≥ 90%)
- [ ] Integration tests pass (≥ 80%)
- [ ] All 33 tools validated
- [ ] Manual AI test completed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version numbers bumped

**Command:**
```bash
npm run test:all && npm run test:performance
```

### 12.3 Production Gates

**Requirements:**
- [ ] All automated tests pass
- [ ] Manual testing completed
- [ ] Installation scripts tested
- [ ] Cross-platform validation (macOS/Linux/Windows)
- [ ] NPM package built
- [ ] Extension bundled
- [ ] Release notes written
- [ ] Migration guide written (if breaking)

### 12.4 Acceptance Criteria

**System MUST:**
1. Start MCP server successfully
2. Load extension in Chrome without errors
3. Connect via WebSocket within 3 seconds
4. Return all 33 tools on tools/list
5. Execute any tool within 5 seconds
6. Handle disconnection and reconnect automatically
7. Work with Claude Desktop (manual test)
8. Work with Cursor (manual test)
9. Handle 10 concurrent requests
10. Run for 1 hour without crashes

**System SHOULD:**
1. Log all errors to stderr
2. Provide helpful error messages
3. Complete tool calls in < 2s (95th percentile)
4. Reconnect in < 2s after disconnect
5. Flush queue on reconnect
6. Support 100 queued messages

---

## 13. Deployment Checklist

### 13.1 Pre-Deployment

**Code:**
- [ ] All tests passing
- [ ] No linter errors
- [ ] No security vulnerabilities (npm audit)
- [ ] Dependencies updated
- [ ] Version numbers consistent

**Documentation:**
- [ ] README.md updated
- [ ] CHANGELOG.md updated
- [ ] API docs generated
- [ ] Migration guide written (if needed)
- [ ] Troubleshooting guide updated

**Build:**
- [ ] NPM package built (`mcp-server/`)
- [ ] Extension bundled (`browser-mcp-extension.zip`)
- [ ] Source maps included (if applicable)
- [ ] Files list correct (package.json files field)

### 13.2 NPM Package Deployment

```bash
cd mcp-server
npm version patch  # or minor, major
npm publish --access public
```

**Verify:**
```bash
npm view @rvegajr/browser-mcp-server
npm install -g @rvegajr/browser-mcp-server
browser-mcp-server --version
```

### 13.3 Extension Deployment

**Chrome Web Store (Future):**
- [ ] Create Web Store developer account
- [ ] Prepare store listing
- [ ] Upload extension ZIP
- [ ] Submit for review

**Manual Install (Current):**
```bash
cd browser-mcp-extension
zip -r ../releases/browser-mcp-extension-v4.0.7.zip .
```

**Verify:**
- [ ] Load unpacked in Chrome
- [ ] Version shows 4.0.7
- [ ] No errors in console
- [ ] WebSocket connects

### 13.4 GitHub Release

```bash
git tag v4.0.7
git push origin v4.0.7
```

**Release Notes Template:**
```markdown
# Browser MCP v4.0.7

## What's New
- Feature 1
- Feature 2
- Bug fix 1

## Installation
\`\`\`bash
npm install -g @rvegajr/browser-mcp-server
\`\`\`

## Breaking Changes
None

## Bug Fixes
- Fix #123: Description
- Fix #456: Description

## Full Changelog
See CHANGELOG.md
```

### 13.5 Post-Deployment Validation

**Smoke Tests:**
- [ ] Install from NPM
- [ ] Run browser-mcp-server
- [ ] Load extension
- [ ] Call tools/list
- [ ] Call 5 random tools
- [ ] Check logs for errors

**Monitoring:**
- [ ] NPM download count
- [ ] GitHub issues
- [ ] User feedback

---

## 14. Appendices

### Appendix A: Test Commands Reference

```bash
# Unit tests
npm run test:unit

# Component tests (E2E)
npm run test:e2e
npm run test:e2e:headed      # With visible browser
npm run test:e2e:debug       # With debugger

# Integration tests
npm run test:integration

# Full test suite
npm test

# Performance tests
npm run test:performance

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

### Appendix B: Debugging Commands

```bash
# Check MCP server status
ps aux | grep browser-mcp-server

# Check WebSocket server
lsof -i :8765

# View extension logs
# Chrome → chrome://extensions/ → Service Worker

# View MCP server logs
tail -f /tmp/browser-mcp-server.log

# Test WebSocket directly
wscat -c ws://localhost:8765
```

### Appendix C: Performance Benchmarks

```bash
# Measure tool execution time
time echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"listTabs","arguments":{}}}' | browser-mcp-server

# Measure WebSocket latency
# (Requires custom test script)
node tests/performance/ws-latency.js

# Stress test
# (Requires custom test script)
node tests/performance/stress-test.js --requests 1000 --concurrent 10
```

### Appendix D: Troubleshooting Matrix

| Symptom | Cause | Solution |
|---------|-------|----------|
| Extension doesn't load | Manifest error | Check Chrome console |
| WebSocket won't connect | Server not running | Start server first |
| Tools/list returns empty | Tools not registered | Check service-worker.js |
| Tool call times out | Chrome API error | Check CDP permissions |
| Reconnection fails | Port in use | Kill process on 8765 |
| IDE doesn't see server | Config wrong | Verify config file path |

---

## 15. Implementation Priority

### Phase 1: Foundation (Current ✅)
- [x] Unit tests
- [x] Component tests
- [x] Architecture verified

### Phase 2: Integration (HIGH PRIORITY 🚨)
- [ ] Message routing tests
- [ ] Tool execution tests
- [ ] Error handling tests
- [ ] Reconnection tests

### Phase 3: Tool Validation (HIGH PRIORITY 🚨)
- [ ] All 33 tools tested individually
- [ ] Input validation
- [ ] Error handling
- [ ] Performance validation

### Phase 4: Full Stack (MEDIUM PRIORITY ⚠️)
- [ ] stdio integration
- [ ] Multi-tool workflows
- [ ] Performance benchmarks
- [ ] Load testing

### Phase 5: Production (MEDIUM PRIORITY ⚠️)
- [ ] Installation scripts
- [ ] Cross-platform testing
- [ ] Manual AI integration
- [ ] Documentation

### Phase 6: Continuous Improvement (ONGOING 🔄)
- [ ] CI/CD pipeline
- [ ] Automated performance tracking
- [ ] User feedback integration
- [ ] Security audits

---

## 16. Success Metrics

### Technical Metrics
- **Test Coverage:** > 80% code coverage
- **Test Pass Rate:** > 95% pass rate
- **Performance:** < 2s tool execution (95th percentile)
- **Reliability:** < 0.1% error rate
- **Uptime:** > 99.9% connection availability

### User Metrics
- **Setup Time:** < 5 minutes to install
- **First Success:** Tool works within 1 minute
- **Error Recovery:** Auto-reconnect within 2 seconds
- **Documentation:** User can solve 90% of issues from docs

### Business Metrics
- **NPM Downloads:** Track weekly
- **GitHub Stars:** Community interest
- **Issues Opened:** User engagement
- **Issues Closed:** Support effectiveness

---

## 17. Conclusion

This specification provides a **complete blueprint** for validating Browser MCP as a production-ready MCP server. By implementing the tests outlined in Section 11 and meeting the quality gates in Section 12, we can guarantee that **any AI assistant** using the MCP protocol can reliably control and inspect browser state via this implementation.

**Next Steps:**
1. Implement missing integration tests (Section 11.3)
2. Implement tool validation tests (Section 11.4)
3. Implement full stack tests (Section 11.5)
4. Execute manual AI integration tests (Section 11.6)
5. Meet all quality gates (Section 12)
6. Deploy (Section 13)

**Estimated Effort:**
- Phase 2 (Integration): 3-5 days
- Phase 3 (Tool Validation): 5-7 days
- Phase 4 (Full Stack): 2-3 days
- Phase 5 (Production): 2-3 days
- **Total: 12-18 days**

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-09  
**Author:** Software Architect  
**Status:** COMPREHENSIVE SPECIFICATION COMPLETE


