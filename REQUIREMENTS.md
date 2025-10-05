# Browser MCP Family - Complete Requirements Document

**Version**: 1.0
**Date**: 2025-01-05
**Status**: Architecture Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Project Vision](#2-project-vision)
3. [System Constraints](#3-system-constraints)
4. [Core Capabilities](#4-core-capabilities)
5. [Architecture Overview](#5-architecture-overview)
6. [Browser Support Matrix](#6-browser-support-matrix)
7. [Data Structures](#7-data-structures)
8. [MCP Protocol Interface](#8-mcp-protocol-interface)
9. [Source Mapping System](#9-source-mapping-system)
10. [Query Optimization](#10-query-optimization)
11. [Performance Requirements](#11-performance-requirements)
12. [Technology Stack](#12-technology-stack)
13. [Package Structure](#13-package-structure)
14. [Implementation Phases](#14-implementation-phases)
15. [Testing Strategy](#15-testing-strategy)
16. [Success Metrics](#16-success-metrics)
17. [Architecture Decision Records](#17-architecture-decision-records)

---

## 1. Executive Summary

### 1.1 Purpose

Create a family of MCP (Model Context Protocol) servers that expose browser internals (Console, DOM, CSS, Network, Performance, Runtime) as **structured, queryable data** for AI coding assistants. The system provides the same level of fidelity for browser state that file system MCP servers provide for codebases.

### 1.2 Key Innovation

**Three-way context integration**: Bridge live browser state, source code files, and source mappings to create a unified debugging context. AI can trace from DOM element → source file → line number and back.

### 1.3 Primary Use Case

**Active browser session debugging**: AI assistant can inspect a developer's running application without requiring copy/paste of console logs, DOM structure, or CSS styles. The MCP server attaches to an existing browser session and provides real-time, structured data extraction.

### 1.4 Core Principle

**Data provider, not analyzer**. The MCP server extracts and structures browser state; the external LLM (Claude, GPT, etc.) performs analysis. No embedded AI, no pattern detection, no fix generation—just high-fidelity data extraction optimized for LLM consumption.

### 1.5 Universal Framework Support

The MCP server is **framework-agnostic** and supports **all major web frameworks and libraries**:

**Component Frameworks**:
- React (Fiber architecture)
- Vue (2.x and 3.x with Composition API)
- Angular (Ivy renderer)
- Svelte
- Solid.js
- Blazor (WebAssembly & Server)
- Preact
- Qwik
- Astro

**Web Components**:
- Lit
- Stencil
- Generic Custom Elements

**Classic Frameworks**:
- Ember.js
- Backbone.js
- Aurelia

**Lightweight Libraries**:
- Alpine.js
- htmx (attribute-based)

**Detection Strategy**: Framework detection happens automatically through runtime inspection. The system checks for framework-specific signatures (React Fiber, Vue component instances, Angular debug API, Blazor attributes, etc.) and extracts component state, props, and source mappings for each.

### 1.6 Zero-Config Browser Extension Model

**Dead simple deployment**: Install browser extension → Activate on tab → AI sees tab as virtual filesystem

**User Experience**:
```
1. Install "Browser Inspector" extension (Chrome/Firefox/Safari)
2. Click extension icon on any tab
3. Extension activates debugging for that tab
4. AI assistant automatically mounts tab as virtual filesystem
5. AI can now read browser:// resources like files
```

**Virtual Filesystem Structure** (as seen by AI):
```
browser://tab-localhost-3000/        # Active tab auto-mounted
├── console/
│   ├── messages                     # Read like a file
│   ├── errors                       # Filter by level
│   └── warnings
├── dom/
│   ├── tree.html                    # Full DOM as HTML
│   ├── tree.json                    # Structured JSON
│   └── elements/
│       ├── .submit-button/          # Query results
│       │   ├── properties.json
│       │   ├── styles.css
│       │   └── source.txt           # Source file mapping
│       └── #header/
├── css/
│   ├── stylesheets/
│   │   ├── main.css
│   │   └── utils.css
│   ├── cascade/
│   │   └── .button/display.json     # Cascade trace
│   └── issues.json                  # Detected CSS issues
├── network/
│   ├── requests.json
│   ├── failures.json
│   └── waterfall.json
├── performance/
│   ├── metrics.json
│   └── trace.json
├── components/                       # Framework components
│   ├── tree.json
│   └── SubmitButton/
│       ├── state.json
│       ├── props.json
│       └── source.tsx               # Mapped source
└── sources/
    ├── map.json                     # Source mapping index
    └── Form.tsx                     # Source files
```

**AI reads browser state like files**:
```
AI: Read browser://tab-localhost-3000/console/errors
AI: Read browser://tab-localhost-3000/dom/elements/.submit-button/styles.css
AI: Read browser://tab-localhost-3000/components/SubmitButton/state.json
```

**No manual configuration required** - extension handles:
- MCP server initialization
- Tab debugging activation
- Virtual filesystem mounting
- Auto-discovery of active tabs

---

## 2. Project Vision

### 2.1 Problem Statement

Current AI coding assistants can:
- ✅ Read source code files
- ✅ Execute terminal commands
- ❌ **Cannot** directly inspect live browser state
- ❌ **Cannot** correlate runtime DOM with source files
- ❌ **Cannot** trace CSS cascade to source locations

This creates friction: developers must manually copy console errors, describe DOM states, take screenshots, or explain CSS behavior.

### 2.2 Solution

Build MCP servers that make browser state as **queryable and structured as source code files**:

```
AI thinks about files:                AI thinks about browser:
├── src/                              ├── browser://dom/tree
│   ├── components/                   ├── browser://css/cascade
│   │   └── Button.tsx                ├── browser://console/messages
│   └── styles/                       ├── browser://network/requests
│       └── button.css                └── browser://components/tree

Query: Read Button.tsx                Query: Read button DOM state
→ File contents                       → Structured DOM + CSS + source mapping
```

### 2.3 Success Criteria

1. **AI can debug without copy/paste**: Query console, DOM, CSS directly
2. **Full source traceability**: Every DOM node/CSS rule maps to source file:line
3. **Sub-100ms queries**: Fast enough for interactive debugging
4. **Cross-browser support**: Works with Chrome, Safari, Firefox
5. **Universal framework support**: Automatically detects and integrates with React, Vue, Angular, Svelte, Blazor, Solid, Lit, Alpine, htmx, Qwik, Ember, and all major web frameworks
6. **Component state inspection**: Access props, state, signals, stores, and parameters for any framework

---

## 2A. Browser Extension Deployment Model

### 2A.1 Extension-First Architecture

**Primary deployment**: Browser extension (not standalone CLI tool)

**Rationale**:
- ✅ Zero-config user experience
- ✅ One-click activation per tab
- ✅ Auto-discovery of active tabs
- ✅ Built-in MCP server (no separate process)
- ✅ Seamless integration with browser debugging
- ✅ Works with any AI assistant that supports MCP

### 2A.2 Extension Architecture

```
┌───────────────────────────────────────────────────────────┐
│                Browser Extension                          │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Background Service Worker               │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  MCP Server (embedded)                   │  │    │
│  │  │  - Handles MCP protocol                  │  │    │
│  │  │  - Manages tab connections               │  │    │
│  │  │  - Routes requests to content scripts    │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  Tab Manager                              │  │    │
│  │  │  - Track active tabs                      │  │    │
│  │  │  - Mount/unmount virtual filesystems     │  │    │
│  │  │  - Handle tab lifecycle                   │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                       │                                   │
│                       │ Browser Messaging API             │
│                       │                                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │      Content Scripts (per active tab)           │    │
│  │  ┌──────────────────────────────────────────┐  │    │
│  │  │  CDP/DevTools Bridge                     │  │    │
│  │  │  - Connect to browser debugging API      │  │    │
│  │  │  - Extract DOM, CSS, Console, Network    │  │    │
│  │  │  - Detect framework                       │  │    │
│  │  └──────────────────────────────────────────┘  │    │
│  └─────────────────────────────────────────────────┘    │
│                                                           │
│  ┌─────────────────────────────────────────────────┐    │
│  │         Popup UI (extension icon)                │    │
│  │  [●] Tab: localhost:3000                        │    │
│  │  Status: ✅ Active - Mounted                    │    │
│  │  Framework: React                               │    │
│  │  [View in AI] [Deactivate]                      │    │
│  └─────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────┘
                       │
                       │ MCP Protocol (Native Messaging / WebSocket)
                       │
┌───────────────────────▼──────────────────────────────────┐
│              AI Assistant (Claude, Cursor, etc.)         │
│         Sees: browser://tab-localhost-3000/              │
└──────────────────────────────────────────────────────────┘
```

### 2A.3 Installation & Activation Flow

**Step 1: Install Extension**
```
Chrome Web Store: "Browser Inspector for AI"
Firefox Add-ons: "Browser Inspector for AI"
Safari Extensions: "Browser Inspector for AI"

Install → Extension icon appears in toolbar
```

**Step 2: Activate on Tab**
```
User opens localhost:3000 (their dev app)
Click extension icon
Extension popup shows:
  ┌─────────────────────────────────────────────┐
  │ Activate debugging for this tab?            │
  │                                             │
  │ Tab: localhost:3000                         │
  │ Framework: React (detected)                 │
  │                                             │
  │ ⚙️ MCP Server Port: [Auto] ▼               │
  │    (Default: auto-select from 3100-3199)   │
  │                                             │
  │ [Activate] [Cancel]                         │
  └─────────────────────────────────────────────┘

Click Activate →
  1. Extension scans for available port (3100-3199 range)
  2. Starts MCP server on first available port (e.g., 3142)
  3. Extension injects content script
  4. Content script connects to browser debugging API
  5. Virtual filesystem mounted: browser://localhost:3000@mcp-3142/
  6. Extension shows success notification with port info
```

**Success Notification** (after activation):
```
  ┌─────────────────────────────────────────────┐
  │ ✅ Tab Activated                            │
  │                                             │
  │ 📡 MCP Server: localhost:3142               │
  │ 🌐 Tab: localhost:3000                      │
  │ ⚛️ Framework: React                         │
  │                                             │
  │ Tell your AI:                               │
  │ "Connect to MCP server at localhost:3142"  │
  │                                             │
  │ [Copy Connection Info] [View Details]      │
  └─────────────────────────────────────────────┘
```

**Step 3: AI Access** (zero config for MCP-aware assistants)
```
// AI assistant auto-discovers MCP server
AI: Detected new MCP server at localhost:3142
AI: Mounting browser://localhost:3000@mcp-3142/

// For manual setup (if AI doesn't auto-discover):
User: "Connect to MCP server at localhost:3142"
AI: Connected! I can now see:
  Project: /Users/dev/myapp/
  Browser: browser://localhost:3000@mcp-3142/

AI can now read:
  Read src/components/Button.tsx      (source file)
  Read browser://localhost:3000@mcp-3142/console/errors   (browser state)
  Read browser://localhost:3000@mcp-3142/components/Button/state.json
```

### 2A.4 Virtual Filesystem MCP Resources

Extension exposes browser state as **filesystem-like resources**:

```typescript
// MCP Resource: browser://tab-{id}/console/messages
// Acts like reading a file
AI: Read "browser://tab-localhost-3000/console/messages"

Response (text format, like a log file):
```
[2025-01-05 12:34:56.123] [ERROR] Uncaught TypeError: Cannot read property 'map' of undefined
  at UserList.tsx:42:15
  at Array.forEach (<anonymous>)

[2025-01-05 12:34:56.456] [WARN] React Hook useEffect has a missing dependency: 'data'
  at Dashboard.tsx:156:8
```

// MCP Resource: browser://tab-{id}/dom/tree.html
AI: Read "browser://tab-localhost-3000/dom/tree.html"

Response (HTML format):
```html
<!DOCTYPE html>
<html>
<head>...</head>
<body>
  <div id="root">
    <div class="App">
      <button class="submit-button hidden">Submit</button>
    </div>
  </div>
</body>
</html>
```

// MCP Resource: browser://tab-{id}/components/SubmitButton/state.json
AI: Read "browser://tab-localhost-3000/components/SubmitButton/state.json"

Response (JSON format):
```json
{
  "componentName": "SubmitButton",
  "framework": "react",
  "props": {
    "onClick": "[Function]",
    "disabled": false,
    "isLoading": true
  },
  "state": {},
  "source": {
    "file": "src/components/SubmitButton.tsx",
    "line": 12
  }
}
```
```

### 2A.5 Smart Port Management

**Automatic Port Selection**:
```typescript
// Extension port allocation strategy

interface PortConfig {
  defaultRange: [number, number];  // [3100, 3199]
  scanTimeout: number;              // 1000ms
  fallbackPorts: number[];          // [3200, 3201, 3202, ...]
}

class PortManager {
  private readonly DEFAULT_RANGE = [3100, 3199];
  private activePorts = new Map<string, number>(); // tabId → port

  async findAvailablePort(): Promise<number> {
    // 1. Scan default range (3100-3199)
    for (let port = this.DEFAULT_RANGE[0]; port <= this.DEFAULT_RANGE[1]; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }

    // 2. Fallback to higher range (3200+)
    for (let port = 3200; port < 3300; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }

    throw new Error('No available ports in range 3100-3300');
  }

  async isPortAvailable(port: number): Promise<boolean> {
    try {
      // Try to bind to port
      const server = await this.tryBind(port);
      await server.close();
      return true;
    } catch {
      return false;
    }
  }

  reservePort(tabId: string, port: number): void {
    this.activePorts.set(tabId, port);
  }

  releasePort(tabId: string): void {
    this.activePorts.delete(tabId);
  }
}
```

**User Notification Flow**:
```
After successful activation:

┌─────────────────────────────────────────────────────┐
│ ✅ Browser Inspector Active                         │
│                                                     │
│ 📡 MCP Server Started                               │
│    Port: 3142                                       │
│    Protocol: HTTP + WebSocket                       │
│                                                     │
│ 🌐 Inspecting Tab                                   │
│    URL: localhost:3000                              │
│    Title: My React App                              │
│    Framework: React 18.2.0                          │
│                                                     │
│ 🤖 Connect Your AI Assistant                        │
│                                                     │
│    Claude Desktop:                                  │
│    "Connect to MCP server at localhost:3142"       │
│                                                     │
│    Or add to config:                                │
│    {                                                │
│      "mcpServers": {                                │
│        "browser": {                                 │
│          "url": "http://localhost:3142"            │
│        }                                            │
│      }                                              │
│    }                                                │
│                                                     │
│ [📋 Copy Port] [📋 Copy Config] [⚙️ Settings]      │
└─────────────────────────────────────────────────────┘
```

**Copy Buttons**:
- **Copy Port**: Copies `3142` to clipboard
- **Copy Config**: Copies full MCP configuration JSON
- **Copy Connection Command**: Copies `"Connect to MCP server at localhost:3142"`

**Port Conflict Handling**:
```
If port is in use:

┌─────────────────────────────────────────────┐
│ ⚠️ Port 3100 is busy                        │
│                                             │
│ Trying next available port...               │
│                                             │
│ ✅ Found port 3142                          │
│                                             │
│ Activating...                               │
└─────────────────────────────────────────────┘
```

**Manual Port Override** (Advanced Settings):
```
Extension Settings → Advanced

┌─────────────────────────────────────────────┐
│ Port Configuration                          │
│                                             │
│ ○ Automatic (recommended)                   │
│   Scan ports 3100-3199                      │
│                                             │
│ ○ Fixed Port                                │
│   Port: [____] (e.g., 3142)                │
│   ⚠️ May conflict with other services       │
│                                             │
│ ○ Custom Range                              │
│   Start: [____] End: [____]                │
│                                             │
│ [Save] [Reset to Defaults]                  │
└─────────────────────────────────────────────┘
```

### 2A.6 Extension Permissions

**Required Browser Permissions**:
- `tabs` - Detect active tabs
- `debugger` - Access browser debugging API (CDP/DevTools)
- `storage` - Save user preferences (port config, activated tabs)
- `nativeMessaging` - Connect to AI assistants via MCP
- `activeTab` - Access current tab when activated

**Privacy-First Design**:
- ⚠️ Extension only activates when user explicitly clicks "Activate"
- ⚠️ Only inspects tabs user chooses
- ⚠️ No data sent to external servers
- ⚠️ All processing happens locally
- ⚠️ User can deactivate any time

### 2A.7 Multi-Tab Support

Extension can handle **multiple active tabs simultaneously**, each with its own MCP server port:

```
Extension Status:

┌─────────────────────────────────────────────┐
│ 🟢 Active Tabs (3)                          │
│                                             │
│ Tab 1: localhost:3000 → Port 3142          │
│   Framework: React                          │
│   [View] [Deactivate]                       │
│                                             │
│ Tab 2: localhost:8080 → Port 3143          │
│   Framework: Vue                            │
│   [View] [Deactivate]                       │
│                                             │
│ Tab 3: staging.myapp.com → Port 3144       │
│   Framework: Angular                        │
│   [View] [Deactivate]                       │
│                                             │
│ [Activate Another Tab]                      │
└─────────────────────────────────────────────┘

AI sees (auto-discovered):
  browser://localhost:3000@mcp-3142/       # Frontend (React)
  browser://localhost:8080@mcp-3143/       # Backend API (Vue admin)
  browser://staging.myapp.com@mcp-3144/    # Staging (Angular)

AI can now compare state across environments:
  "Compare console errors between localhost:3000 and staging"
  "What's different in the DOM between dev and staging?"
```

**Port Allocation Strategy**:
- First tab activated → Gets first available port (3142)
- Second tab activated → Gets next available port (3143)
- Third tab activated → Gets next available port (3144)
- Each tab maintains its own MCP server instance
- Ports are released when tabs are deactivated

### 2A.8 Alternative: Standalone MCP Server (Legacy Mode)

For users who prefer **CLI deployment** (no extension):

```bash
# Launch browser with debugging
chrome --remote-debugging-port=9222

# Start MCP server (separate process)
npx @browser-mcp/server-chromium --attach --port=9222

# Configure AI assistant
# claude_desktop_config.json:
{
  "mcpServers": {
    "browser": {
      "command": "npx",
      "args": ["@browser-mcp/server-chromium", "--attach"]
    }
  }
}
```

**Tradeoffs**:
- ✅ No extension required
- ✅ More control over configuration
- ❌ Manual browser launch with debugging flag
- ❌ Manual MCP server start
- ❌ No auto-discovery of tabs
- ❌ More complex setup

**Recommendation**: Extension-first for 95% of users, CLI mode for advanced users who want control.

---

## 3. System Constraints

| Constraint Type | Description | Flexibility |
|----------------|-------------|-------------|
| **Target Browsers** | Chromium (Chrome, Edge, Brave), WebKit (Safari), Firefox | Fixed - protocol-specific |
| **Protocol Foundation** | CDP (Chromium), WebInspector (WebKit), RDP (Firefox) | Fixed - browser native protocols |
| **Communication Layer** | Model Context Protocol (MCP) via JSON-RPC | Fixed - MCP standard |
| **Language** | TypeScript/Node.js | Fixed - MCP ecosystem standard |
| **Architecture** | Event-driven, Interface-segregated (per .cursorrules) | Fixed - mandatory |
| **Deployment** | Local development first, remote optional | Flexible - start local |
| **Node.js Version** | >= 18.0.0 | Flexible - but LTS required |
| **MCP Protocol Version** | 1.0+ | Fixed - current standard |

---

## 4. Core Capabilities

### 4.1 Console Domain

**Objective**: Capture and structure all console output with full fidelity

**Features**:
- Capture all console messages (log, warn, error, info, debug, trace)
- Preserve stack traces with source locations
- Track timestamps, source files, line numbers
- Support filtering by level, source, time range
- Capture structured logging (console.table, console.dir, console.group)
- Clear console programmatically

**MCP Resources**:
```
browser://console/messages           # All messages
browser://console/errors             # Error messages only
browser://console/warnings           # Warning messages only
browser://console/since/{timestamp}  # Messages since timestamp
```

**MCP Tools**:
```
get_console_messages(filters?)       # Query console with filters
evaluate_console(code)               # Execute JS in console context
clear_console()                      # Clear console messages
```

**Data Structure**:
```typescript
interface ConsoleMessage {
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug' | 'trace';
  text: string;
  source: string;
  url?: string;
  lineNumber?: number;
  columnNumber?: number;
  stackTrace?: StackFrame[];
  args?: any[];
}
```

---

### 4.2 DOM Domain

**Objective**: Extract complete DOM structure with source mapping

**Features**:
- Query DOM using CSS selectors
- Get full DOM tree (with compression/pagination)
- Traverse DOM hierarchy (parents, children, siblings)
- Get element properties, attributes, computed styles
- Monitor DOM mutations in real-time
- Capture element screenshots
- Access accessibility tree
- Map DOM nodes to source files (React/Vue components)

**MCP Resources**:
```
browser://dom/tree                   # Full DOM tree
browser://dom/element/{selector}     # Specific element details
browser://dom/with-sources           # DOM + source mappings
browser://components/tree            # Component hierarchy
```

**MCP Tools**:
```
query_dom(selector, options?)        # CSS selector queries
get_element_context(selector)        # DOM + styles + source + state
get_full_dom(options?)               # Complete DOM tree
trace_dom_to_source(selector)        # Map DOM → source file
```

**Data Structure**:
```typescript
interface DOMNode {
  nodeId: number;
  nodeType: number;
  nodeName: string;
  localName: string;
  nodeValue?: string;

  // Hierarchy
  parentId?: number;
  childNodeIds: number[];

  // Attributes
  attributes?: Record<string, string>;

  // Computed styles (optional)
  computedStyle?: Record<string, string>;

  // Box model (if rendered)
  boxModel?: BoxModel;

  // Source mapping
  sourceLocation?: SourceLocation;

  // Framework metadata
  frameworkData?: FrameworkData;
}

interface DOMTree {
  documentURL: string;
  root: DOMNode;
  nodeMap: Map<number, DOMNode>;  // Flat map for O(1) lookup
  stats: {
    totalNodes: number;
    maxDepth: number;
  };
}
```

---

### 4.3 CSS Domain

**Objective**: Trace CSS cascade with complete source mapping

**Features**:
- Get all stylesheets loaded in page
- Get matched CSS rules for element (in cascade order)
- Get final computed styles
- **Trace CSS property through cascade** (key feature)
- Get inline styles
- Analyze why element is not visible
- Get layout/box model information
- Map CSS rules to source files (SCSS, CSS-in-JS, etc.)
- Calculate specificity

**MCP Resources**:
```
browser://css/stylesheets            # All loaded stylesheets
browser://css/matched/{selector}     # Matched rules for element
browser://css/computed/{selector}    # Computed styles
browser://css/trace/{selector}/{property}  # Cascade trace
```

**MCP Tools**:
```
trace_css_property(selector, property)     # Trace through cascade
analyze_visibility(selector)               # Why element isn't visible
get_matched_styles(selector)               # All matched rules
get_computed_styles(selector)              # Final computed values
debug_style(selector, property)            # Complete style analysis
```

**Data Structure**:
```typescript
interface StyleTrace {
  property: string;
  finalValue: string;
  finalSource: StyleSource;

  // Complete cascade chain (in application order)
  cascade: CascadeEntry[];

  // Detected conflicts
  conflicts: StyleConflict[];

  // Inheritance chain (if inherited property)
  inheritanceChain?: InheritanceEntry[];
}

interface CascadeEntry {
  value: string;
  source: StyleSource;
  specificity: Specificity;
  important: boolean;
  applied: boolean;        // FALSE if overridden
  overriddenBy?: StyleSource;
  order: number;
}

interface StyleSource {
  type: 'user-agent' | 'user' | 'author' | 'inline' | 'inherited';

  // For author styles
  stylesheet?: {
    href: string;
    title?: string;
  };

  // Rule details
  selector?: string;
  lineNumber?: number;
  columnNumber?: number;

  // Source mapping (SCSS → CSS)
  originalFile?: string;
  originalLine?: number;
}

interface VisibilityAnalysis {
  visible: boolean;
  rendered: boolean;
  inViewport: boolean;

  // Why element is not visible
  blockers: VisibilityBlocker[];

  // Box model dimensions
  dimensions: {
    width: number;
    height: number;
    contentBox: Box;
    paddingBox: Box;
    borderBox: Box;
    marginBox: Box;
  };

  // Computed properties affecting visibility
  visibilityProperties: {
    display: string;
    visibility: string;
    opacity: string;
    position: string;
    zIndex: string;
    // ... others
  };
}

interface VisibilityBlocker {
  type: 'display-none' | 'visibility-hidden' | 'opacity-zero' |
        'zero-dimensions' | 'position-offscreen' | 'parent-hidden';
  property: string;
  value: string;
  source: StyleSource;
}
```

---

### 4.4 Network Domain

**Objective**: Monitor network activity with timing data

**Features**:
- Capture all HTTP/HTTPS requests
- Record request/response headers, bodies
- Track timing information (DNS, TCP, SSL, TTFB, download)
- Monitor WebSocket connections
- Analyze cache behavior
- Filter by URL, status code, time range

**MCP Resources**:
```
browser://network/requests           # All network requests
browser://network/failures           # Failed requests
browser://network/since/{timestamp}  # Requests since timestamp
```

**MCP Tools**:
```
get_network_requests(filters?)       # Query network activity
get_request_details(requestId)       # Full request/response data
clear_network_log()                  # Clear captured data
```

**Data Structure**:
```typescript
interface NetworkRequest {
  requestId: string;
  url: string;
  method: string;
  headers: Record<string, string>;
  timestamp: number;

  // Response
  status?: number;
  statusText?: string;
  responseHeaders?: Record<string, string>;

  // Timing
  timing: {
    dns: number;
    tcp: number;
    ssl: number;
    ttfb: number;
    download: number;
    total: number;
  };

  // Body (optional, can be large)
  requestBody?: string;
  responseBody?: string;

  // Initiator
  initiator?: {
    type: 'script' | 'fetch' | 'xhr' | 'img' | 'css';
    source?: SourceLocation;
  };
}
```

---

### 4.5 Performance Domain

**Objective**: Capture performance metrics and traces

**Features**:
- Collect Core Web Vitals (LCP, FID, CLS, TTFB)
- Capture performance traces
- Memory heap snapshots
- CPU profiling
- Frame rate monitoring
- Resource timing

**MCP Resources**:
```
browser://performance/metrics        # Core Web Vitals
browser://performance/trace          # Performance trace
browser://performance/memory         # Memory usage
```

**MCP Tools**:
```
get_performance_metrics()            # Current metrics snapshot
capture_performance_trace()          # Record performance trace
get_memory_snapshot()                # Heap snapshot
```

**Data Structure**:
```typescript
interface PerformanceMetrics {
  timestamp: number;

  // Core Web Vitals
  lcp: number;      // Largest Contentful Paint
  fid: number;      // First Input Delay
  cls: number;      // Cumulative Layout Shift
  ttfb: number;     // Time to First Byte
  fcp: number;      // First Contentful Paint

  // Memory
  memoryUsed: number;
  memoryTotal: number;

  // Frame rate
  fps: number;
}
```

---

### 4.6 Runtime Domain

**Objective**: Execute JavaScript and inspect runtime state

**Features**:
- Evaluate JavaScript expressions
- Call JavaScript functions
- Access global objects
- Inspect object properties
- Handle promises and async operations

**MCP Resources**:
```
browser://runtime/globals            # Global variables
browser://runtime/context            # Execution context info
```

**MCP Tools**:
```
evaluate_js(code)                    # Execute JavaScript
call_function(fn, args)              # Call specific function
get_object_properties(objectId)      # Inspect objects
```

---

### 4.7 Source Mapping Domain (NEW)

**Objective**: Bridge runtime state with source code files

**Features**:
- Map DOM nodes to source files (React/Vue components)
- Map CSS rules to source files (SCSS, CSS-in-JS)
- Map stack traces to source files (TypeScript → JavaScript)
- Reverse map: Find runtime location from source file
- Framework integration (React/Vue DevTools)

**MCP Resources**:
```
browser://sources/map                # Complete source map index
browser://sources/element/{selector} # Source for DOM element
browser://sources/component/{name}   # Component source code
```

**MCP Tools**:
```
trace_dom_to_source(selector)        # DOM → source file
trace_source_to_dom(file, line)      # Source → DOM nodes
get_component_source(name)           # Get component source code
map_stack_trace(stackTrace)          # Stack trace → source files
get_render_context(selector)         # Complete rendering context
```

**Data Structure**:
```typescript
interface SourceLocation {
  file: string;
  line: number;
  column: number;

  // Source code context
  snippet: string;
  surroundingLines: string[];

  // For frameworks
  componentName?: string;

  // If source mapped (TypeScript → JS)
  originalFile?: string;
  originalLine?: number;
  originalColumn?: number;
}

interface ComponentSource {
  name: string;
  file: string;

  // Parsed component structure
  template?: string;
  script?: string;
  styles?: string[];

  // Dependencies
  imports: Import[];
  props: PropDefinition[];

  // Where it renders in DOM
  domNodes: number[];
}

interface FrameworkData {
  framework: 'react' | 'vue' | 'angular' | 'svelte' | 'solid' | 'blazor' |
             'ember' | 'backbone' | 'lit' | 'alpine' | 'htmx' | 'qwik' |
             'astro' | 'preact' | 'stencil' | 'aurelia' | null;

  // React
  reactFiber?: {
    componentName: string;
    props: Record<string, any>;
    state: Record<string, any>;
    hooks?: any[];
    source?: {
      fileName: string;
      lineNumber: number;
    };
  };

  // Vue (2.x and 3.x)
  vueComponent?: {
    name: string;
    version: '2' | '3';
    props: Record<string, any>;
    data: Record<string, any>;
    computed: Record<string, any>;
    setup?: any;  // Vue 3 Composition API
    source?: string;
  };

  // Angular
  angularComponent?: {
    name: string;
    selector: string;
    template: string;
    templateUrl?: string;
    inputs: Record<string, any>;
    outputs: string[];
    source?: string;
  };

  // Svelte
  svelteComponent?: {
    name: string;
    props: Record<string, any>;
    stores: Record<string, any>;
    source?: string;
  };

  // Solid.js
  solidComponent?: {
    name: string;
    props: Record<string, any>;
    signals: Array<{ name: string; value: any }>;
    source?: string;
  };

  // Blazor (WebAssembly or Server)
  blazorComponent?: {
    name: string;
    mode: 'wasm' | 'server';
    parameters: Record<string, any>;
    assemblyName: string;
    typeName: string;
    namespace: string;
    source?: {
      file: string;  // .razor or .razor.cs file
      line?: number;
    };
  };

  // Ember.js
  emberComponent?: {
    name: string;
    elementId: string;
    tagName: string;
    args: Record<string, any>;
    source?: string;
  };

  // Lit (Web Components)
  litElement?: {
    tagName: string;
    properties: Record<string, any>;
    className: string;
    source?: string;
  };

  // Alpine.js
  alpineComponent?: {
    data: Record<string, any>;
    xData?: string;
    xInit?: string;
    source?: string;
  };

  // Qwik
  qwikComponent?: {
    name: string;
    props: Record<string, any>;
    signals: Record<string, any>;
    source?: string;
  };

  // Astro
  astroComponent?: {
    name: string;
    props: Record<string, any>;
    islands: boolean;  // Is this an Astro island?
    source?: string;
  };

  // Preact
  preactComponent?: {
    name: string;
    props: Record<string, any>;
    state: Record<string, any>;
    source?: string;
  };

  // Stencil
  stencilComponent?: {
    tagName: string;
    properties: Record<string, any>;
    states: Record<string, any>;
    source?: string;
  };

  // Aurelia
  aureliaComponent?: {
    name: string;
    viewModel: any;
    bindingContext: Record<string, any>;
    source?: string;
  };

  // htmx (attribute-based, no components)
  htmxAttributes?: {
    hxGet?: string;
    hxPost?: string;
    hxPut?: string;
    hxPatch?: string;
    hxDelete?: string;
    hxTarget?: string;
    hxSwap?: string;
    hxTrigger?: string;
    hxVals?: string;
    [key: string]: any;
  };

  // Backbone.js
  backboneView?: {
    cid: string;
    className: string;
    tagName: string;
    model?: any;
    collection?: any;
  };

  // Generic Web Component (for custom elements)
  webComponent?: {
    tagName: string;
    customElement: string;
    shadowRoot: boolean;
    properties: Record<string, any>;
    attributes: Record<string, string>;
  };
}
```

---

## 5. Architecture Overview

### 5.1 System Context (C4 Level 1)

```
┌───────────────────────────────────────────────────────────┐
│              AI Coding Assistant                          │
│         (Claude, Cursor, VS Code, etc.)                   │
└────────────────────┬──────────────────────────────────────┘
                     │ MCP Protocol (JSON-RPC)
                     │ Structured queries, structured responses
                     │
┌────────────────────▼──────────────────────────────────────┐
│         Browser MCP Server Family                         │
│         (Data extraction & structuring only)              │
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │  Chromium    │  │   WebKit     │  │   Firefox    │   │
│  │  MCP Server  │  │  MCP Server  │  │  MCP Server  │   │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │
│         │                  │                  │            │
│         └──────────────────┼──────────────────┘            │
│                            │                               │
│                  ┌─────────▼─────────┐                    │
│                  │  Shared Core      │                    │
│                  │  (Contracts +     │                    │
│                  │   Business Logic) │                    │
│                  └───────────────────┘                    │
└────────────────────┬──────────────────────────────────────┘
                     │ Native Browser Protocol
                     │ (CDP / WebInspector / RDP)
                     │
┌────────────────────▼──────────────────────────────────────┐
│              Browser Instance                             │
│         (Chrome, Safari, Firefox)                         │
│         Running developer's application                   │
└───────────────────────────────────────────────────────────┘
```

### 5.2 Container Diagram (C4 Level 2)

```
┌────────────────────────────────────────────────────────────┐
│            Browser MCP Server (e.g., Chromium)             │
│                                                            │
│  ┌──────────────────────────────────────────────────┐    │
│  │         MCP Server Layer                         │    │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐ │    │
│  │  │ Resources  │  │   Tools    │  │  Prompts   │ │    │
│  │  │  Handler   │  │  Handler   │  │  Handler   │ │    │
│  │  └────────────┘  └────────────┘  └────────────┘ │    │
│  └───────────────────────┬──────────────────────────┘    │
│                          │ IServer Interface              │
│  ┌───────────────────────▼──────────────────────────┐    │
│  │         Domain Bridge Layer                      │    │
│  │  (Implements IDomainBridge interfaces)           │    │
│  │                                                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │    │
│  │  │ Console  │ │   DOM    │ │   CSS    │        │    │
│  │  │  Bridge  │ │  Bridge  │ │  Bridge  │        │    │
│  │  └──────────┘ └──────────┘ └──────────┘        │    │
│  │                                                   │    │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐        │    │
│  │  │ Network  │ │  Perf    │ │ Runtime  │        │    │
│  │  │  Bridge  │ │  Bridge  │ │  Bridge  │        │    │
│  │  └──────────┘ └──────────┘ └──────────┘        │    │
│  │                                                   │    │
│  │  ┌──────────┐ ┌──────────┐                      │    │
│  │  │  Source  │ │SourceMap │                      │    │
│  │  │  Bridge  │ │  Bridge  │                      │    │
│  │  └──────────┘ └──────────┘                      │    │
│  └───────────────────────┬──────────────────────────┘    │
│                          │ IProtocolClient Interface      │
│  ┌───────────────────────▼──────────────────────────┐    │
│  │        Protocol Client Layer                     │    │
│  │  ┌────────────────────────────────────────┐     │    │
│  │  │  Browser Protocol Client               │     │    │
│  │  │  (CDP / WebInspector / RDP)            │     │    │
│  │  │  - Command dispatch                    │     │    │
│  │  │  - Event handling                      │     │    │
│  │  │  - Connection management               │     │    │
│  │  └────────────────────────────────────────┘     │    │
│  └───────────────────────┬──────────────────────────┘    │
│                          │                                │
│  ┌───────────────────────▼──────────────────────────┐    │
│  │       Browser Connection Manager                 │    │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐  │    │
│  │  │  Launch    │  │  Attach to │  │ Discover │  │    │
│  │  │  Browser   │  │  Existing  │  │ Targets  │  │    │
│  │  └────────────┘  └────��───────┘  └──────────┘  │    │
│  └───────────────────────────────────────────────────┘    │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

### 5.3 Key Architectural Principles

1. **Interface Segregation** (ISP - per .cursorrules)
   - All interfaces in separate `contracts/` package
   - Zero implementations in contracts package
   - All bridges implement interfaces from contracts

2. **Event-Driven Architecture**
   - Browser events → Event Bus → Bridges
   - Loose coupling between components
   - Start with in-memory EventEmitter3 (no over-engineering)

3. **Data Provider Pattern**
   - Extract data from browser
   - Structure it for LLM consumption
   - Return via MCP
   - **NO analysis, NO pattern detection, NO AI**

4. **Protocol Abstraction**
   - Generic `IProtocolClient` interface
   - Browser-specific implementations (CDP, WebInspector, RDP)
   - Shared core logic across browsers

5. **Caching Strategy**
   - Multi-tier cache (L1: hot, L2: warm, L3: cold)
   - Smart invalidation (DOM mutations, stylesheet changes)
   - Cache by query hash, not just selector

---

## 6. Browser Support Matrix

### 6.1 Target Browsers

| Browser | Protocol | Status | Priority |
|---------|----------|--------|----------|
| **Chrome** | Chrome DevTools Protocol (CDP) | MVP | High |
| **Edge** | CDP | MVP | High |
| **Brave** | CDP | MVP | Medium |
| **Chromium** | CDP | MVP | High |
| **Safari** | WebKit Remote Inspector | Phase 2 | High |
| **Safari iOS** | WebKit Remote Inspector | Phase 3 | Medium |
| **Firefox** | Remote Debugging Protocol (RDP) | Phase 2 | High |

### 6.2 Protocol Comparison

| Feature | CDP (Chromium) | WebInspector (WebKit) | RDP (Firefox) |
|---------|----------------|----------------------|---------------|
| **Console** | ✅ Full | ✅ Full | ✅ Full |
| **DOM** | ✅ Full | ✅ Full | ✅ Full |
| **CSS Cascade** | ✅ Full | ✅ Full | ✅ Full |
| **Network** | ✅ Full | ✅ Full | ✅ Full |
| **Performance** | ✅ Full | ✅ Full | ✅ Full |
| **Source Maps** | ✅ Full | ✅ Full | ✅ Full |
| **React DevTools** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Stability** | ✅ Stable + ToT | ✅ Stable | ✅ Stable |
| **Documentation** | ✅ Excellent | ⚠️ Good | ⚠️ Good |

### 6.3 Connection Methods

**Chromium (CDP)**:
```bash
# Launch with debugging
chrome --remote-debugging-port=9222

# MCP server connects to
ws://localhost:9222/devtools/browser/{id}
```

**Safari (WebInspector)**:
```
Safari → Preferences → Advanced → Show Develop menu
Develop → Allow Remote Automation

# MCP server connects to
ws://localhost:9230
```

**Firefox (RDP)**:
```
Firefox → Tools → Browser Tools → Browser Console
Settings → Enable remote debugging

# MCP server connects to
TCP localhost:6000
```

---

## 7. Data Structures

### 7.1 Core Types

```typescript
// contracts/types/CommonTypes.ts

interface SourceLocation {
  file: string;
  line: number;
  column: number;
  snippet?: string;
  componentName?: string;
}

interface BoxModel {
  content: Box;
  padding: Box;
  border: Box;
  margin: Box;
}

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface StackFrame {
  functionName: string;
  url: string;
  lineNumber: number;
  columnNumber: number;
  source?: SourceLocation;  // Mapped to original source
}

interface Specificity {
  inline: number;    // 1000
  ids: number;       // 100
  classes: number;   // 10
  elements: number;  // 1
  total: number;
}
```

### 7.2 Query Response Format

All MCP responses follow this structure:

```typescript
interface MCPResponse<T> {
  // Versioned schema
  version: string;        // e.g., "1.0"
  type: string;           // e.g., "VisibilityAnalysis"

  // Actual data
  data: T;

  // Metadata for AI
  meta: {
    queryType: string;
    executionTime: string;
    cacheHit: boolean;

    // Hints for follow-up queries
    suggestedQueries?: string[];

    // Detected issues
    detectedIssues?: Issue[];
  };
}

interface Issue {
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  element?: string;
  description: string;
  hint?: string;
}
```

### 7.3 Progressive Disclosure

Responses use progressive disclosure to minimize data transfer:

```typescript
// Layer 1: Summary (always returned, ~1KB)
interface Summary {
  element: string;
  visible: boolean;
  primaryBlocker?: string;
  sourceComponent?: string;
  hasMoreDetails: boolean;
}

// Layer 2: Details (on request, ~10KB)
interface Details {
  cascade: CascadeEntry[];    // Top 5 most relevant
  componentState: any;
  eventHandlers: EventHandler[];
}

// Layer 3: Full (on explicit request, ~100KB)
interface Full {
  completeCascade: CascadeEntry[];  // All rules
  fullComponentTree: ComponentTree;
  allEventHandlers: EventHandler[];
}
```

---

## 8. MCP Protocol Interface

### 8.1 Resource Naming Convention

```
browser://{domain}/{resource}[/{id}][?params]

Examples:
browser://console/messages
browser://console/errors
browser://console/messages?since=1234567890
browser://dom/tree
browser://dom/element/.submit-button
browser://css/trace/.submit-button/display
browser://network/requests?status=404
browser://performance/metrics
browser://sources/map
```

### 8.2 Core Resources

```typescript
// Console
browser://console/messages           // All console messages
browser://console/errors             // Errors only
browser://console/warnings           // Warnings only
browser://console/since/{timestamp}  // Since timestamp

// DOM
browser://dom/tree                   // Full DOM tree
browser://dom/element/{selector}     // Element details
browser://dom/with-sources           // DOM + source mappings

// CSS
browser://css/stylesheets            // All stylesheets
browser://css/matched/{selector}     // Matched rules
browser://css/computed/{selector}    // Computed styles
browser://css/trace/{selector}/{property}  // Cascade trace

// Network
browser://network/requests           // All requests
browser://network/failures           // Failed requests
browser://network/since/{timestamp}  // Since timestamp

// Performance
browser://performance/metrics        // Current metrics
browser://performance/trace          // Performance trace

// Sources
browser://sources/map                // Complete source map
browser://components/tree            // Component hierarchy

// Page-level views
browser://page/dom                   // Full page DOM
browser://page/components            // Component tree
browser://page/issues                // Detected issues
```

### 8.3 Core Tools

```typescript
// Console
get_console_messages(filters?: ConsoleFilters): ConsoleMessage[]
evaluate_console(code: string): EvaluationResult
clear_console(): void

// DOM
query_dom(selector: string, options?: QueryOptions): DOMNode[]
get_element_context(selector: string): ElementContext
get_full_dom(options?: DOMOptions): DOMTree
trace_dom_to_source(selector: string): SourceReference

// CSS
trace_css_property(selector: string, property: string): StyleTrace
analyze_visibility(selector: string): VisibilityAnalysis
get_matched_styles(selector: string): MatchedStyles
get_computed_styles(selector: string): ComputedStyles
debug_style(selector: string, property: string): StyleDebugInfo

// Network
get_network_requests(filters?: NetworkFilters): NetworkRequest[]
get_request_details(requestId: string): RequestDetails
clear_network_log(): void

// Performance
get_performance_metrics(): PerformanceMetrics
capture_performance_trace(): PerformanceTrace
get_memory_snapshot(): MemorySnapshot

// Runtime
evaluate_js(code: string): any
call_function(fn: string, args: any[]): any
get_object_properties(objectId: string): Record<string, any>

// Source Mapping
trace_source_to_dom(file: string, line: number): DOMNode[]
get_component_source(name: string): ComponentSource
map_stack_trace(stackTrace: StackTrace): MappedStackTrace
get_render_context(selector: string): RenderContext

// High-level debugging tools
debug_visibility(selector: string): VisibilityDebugInfo
debug_reactivity(selector: string): ReactivityDebugInfo
find_issues(): Issue[]

// Snapshots & Diffing
capture_snapshot(): Snapshot
diff_snapshots(id1: string, id2: string): SnapshotDiff

// Batch operations
batch_query(queries: Query[]): BatchResult[]
```

### 8.4 Tool Parameter Examples

```typescript
// Console filters
interface ConsoleFilters {
  level?: 'log' | 'warn' | 'error' | 'info' | 'debug' | 'trace';
  source?: string;
  since?: number;  // timestamp
  until?: number;  // timestamp
  limit?: number;
  offset?: number;
}

// DOM query options
interface QueryOptions {
  includeStyles?: boolean;
  includeAttributes?: boolean;
  includeChildren?: boolean;
  maxDepth?: number;
}

// Network filters
interface NetworkFilters {
  url?: string | RegExp;
  status?: number;
  method?: string;
  since?: number;
  until?: number;
  limit?: number;
}
```

---

## 9. Source Mapping System

### 9.1 Multi-Layer Mapping Strategy

```
Layer 1: Runtime → Compiled
  DOM element → webpack bundle.js:1234

Layer 2: Compiled → Source
  bundle.js:1234 → Button.tsx:45 (via source maps)

Layer 3: Source → Component
  Button.tsx:45 → SubmitButton component

Layer 4: Component → State
  SubmitButton → { props: {...}, state: {...} }
```

### 9.2 Framework Integration

The MCP server detects and integrates with **all major web frameworks** through runtime inspection and DevTools APIs.

#### **Framework Detection Strategy**

```typescript
class UniversalFrameworkDetector {
  async detectFramework(nodeId: number): Promise<FrameworkData | null> {
    // Try detection in order of popularity
    const detectors = [
      this.detectReact,
      this.detectVue,
      this.detectAngular,
      this.detectSvelte,
      this.detectBlazor,
      this.detectSolid,
      this.detectLit,
      this.detectAlpine,
      this.detectQwik,
      this.detectEmber,
      this.detectStencil,
      this.detectAurelia,
      this.detectPreact,
      this.detectHtmx,
      this.detectBackbone,
      this.detectWebComponent
    ];

    for (const detect of detectors) {
      const data = await detect(nodeId);
      if (data) return data;
    }

    return null;
  }
}
```

#### **React Integration**
```typescript
class ReactIntegration {
  async getReactFiberData(nodeId: number): Promise<ReactFiber> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const node = document.querySelector('[data-id="${nodeId}"]');
          const key = Object.keys(node).find(k => k.startsWith('__reactFiber'));
          if (!key) return null;

          const fiber = node[key];
          return {
            componentName: fiber.type?.name || fiber.type?.displayName,
            props: fiber.memoizedProps,
            state: fiber.memoizedState,
            source: fiber._debugSource,  // { fileName, lineNumber }
            hooks: fiber.memoizedState
          };
        })()
      `
    });

    return result.value;
  }
}
```

#### **Vue Integration (2.x and 3.x)**
```typescript
class VueIntegration {
  async getVueComponentData(nodeId: number): Promise<VueComponent> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const node = document.querySelector('[data-id="${nodeId}"]');

          // Vue 2.x
          if (node.__vue__) {
            return {
              version: '2',
              name: node.__vue__.$options.name,
              props: node.__vue__.$props,
              data: node.__vue__.$data,
              computed: node.__vue__._computedWatchers,
              source: node.__vue__.$options.__file
            };
          }

          // Vue 3.x
          if (node.__vueParentComponent) {
            const instance = node.__vueParentComponent;
            return {
              version: '3',
              name: instance.type.name,
              props: instance.props,
              data: instance.data,
              setup: instance.setupState,
              source: instance.type.__file
            };
          }

          return null;
        })()
      `
    });

    return result.value;
  }
}
```

#### **Angular Integration**
```typescript
class AngularIntegration {
  async getAngularComponentData(nodeId: number): Promise<AngularComponent> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const node = document.querySelector('[data-id="${nodeId}"]');
          const ng = window.ng;
          if (!ng) return null;

          const component = ng.getComponent(node);
          const context = ng.getContext(node);

          return {
            name: component.constructor.name,
            selector: context.selector,
            inputs: component,
            outputs: Object.keys(component).filter(k => k.endsWith('Change'))
          };
        })()
      `
    });

    return result.value;
  }
}
```

#### **Blazor Integration (WebAssembly & Server)**
```typescript
class BlazorIntegration {
  async getBlazorComponentData(nodeId: number): Promise<BlazorComponent> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const node = document.querySelector('[data-id="${nodeId}"]');

          // Blazor components have special attributes
          const blazorId = node.getAttribute('_bl_');
          if (!blazorId) return null;

          // Access Blazor internals via window.Blazor
          const blazor = window.Blazor;
          if (!blazor) return null;

          // Get component info from Blazor runtime
          const componentInfo = blazor._internal.getComponentInfo(blazorId);

          return {
            name: componentInfo.typeName,
            mode: blazor._internal.renderMode, // 'wasm' or 'server'
            assemblyName: componentInfo.assembly,
            typeName: componentInfo.type,
            namespace: componentInfo.namespace,
            parameters: componentInfo.parameters
          };
        })()
      `
    });

    return result.value;
  }
}
```

#### **Svelte Integration**
```typescript
class SvelteIntegration {
  async getSvelteComponentData(nodeId: number): Promise<SvelteComponent> {
    // Svelte uses special data attributes in dev mode
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const node = document.querySelector('[data-id="${nodeId}"]');
          const svelteKey = Object.keys(node).find(k => k.startsWith('__svelte_'));
          if (!svelteKey) return null;

          const component = node[svelteKey];
          return {
            name: component.constructor.name,
            props: component.$$.props,
            stores: component.$$.ctx
          };
        })()
      `
    });

    return result.value;
  }
}
```

#### **Solid.js Integration**
```typescript
class SolidIntegration {
  async getSolidComponentData(nodeId: number): Promise<SolidComponent> {
    // Solid uses signals for reactivity
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const node = document.querySelector('[data-id="${nodeId}"]');
          // Solid stores component info in _$owner
          const owner = node._$owner;
          if (!owner) return null;

          return {
            name: owner.name,
            props: owner.props,
            signals: owner.sources
          };
        })()
      `
    });

    return result.value;
  }
}
```

#### **Lit/Web Components Integration**
```typescript
class LitIntegration {
  async getLitElementData(nodeId: number): Promise<LitElement> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const node = document.querySelector('[data-id="${nodeId}"]');

          // Check if it's a custom element
          if (!node.constructor.name || node.constructor === HTMLElement) {
            return null;
          }

          // Lit elements have special properties
          return {
            tagName: node.tagName.toLowerCase(),
            className: node.constructor.name,
            properties: node.constructor.properties || {},
            shadowRoot: !!node.shadowRoot
          };
        })()
      `
    });

    return result.value;
  }
}
```

#### **Alpine.js Integration**
```typescript
class AlpineIntegration {
  async getAlpineComponentData(nodeId: number): Promise<AlpineComponent> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const node = document.querySelector('[data-id="${nodeId}"]');

          // Alpine stores data in _x_dataStack
          if (!node._x_dataStack) return null;

          return {
            data: node._x_dataStack[0],
            xData: node.getAttribute('x-data'),
            xInit: node.getAttribute('x-init')
          };
        })()
      `
    });

    return result.value;
  }
}
```

#### **htmx Integration**
```typescript
class HtmxIntegration {
  async getHtmxAttributes(nodeId: number): Promise<HtmxAttributes> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const node = document.querySelector('[data-id="${nodeId}"]');

          // Get all hx-* attributes
          const attrs = {};
          for (const attr of node.attributes) {
            if (attr.name.startsWith('hx-')) {
              attrs[attr.name] = attr.value;
            }
          }

          return Object.keys(attrs).length > 0 ? attrs : null;
        })()
      `
    });

    return result.value;
  }
}
```

#### **Qwik Integration**
```typescript
class QwikIntegration {
  async getQwikComponentData(nodeId: number): Promise<QwikComponent> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const node = document.querySelector('[data-id="${nodeId}"]');

          // Qwik uses q:* attributes
          const qId = node.getAttribute('q:id');
          if (!qId) return null;

          return {
            name: node.getAttribute('q:component'),
            props: JSON.parse(node.getAttribute('q:props') || '{}'),
            signals: JSON.parse(node.getAttribute('q:state') || '{}')
          };
        })()
      `
    });

    return result.value;
  }
}
```

#### **Ember.js Integration**
```typescript
class EmberIntegration {
  async getEmberComponentData(nodeId: number): Promise<EmberComponent> {
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const node = document.querySelector('[data-id="${nodeId}"]');
          const emberView = window.Ember?.View?.views[node.id];

          if (!emberView) return null;

          return {
            name: emberView.constructor.name,
            elementId: emberView.elementId,
            tagName: emberView.tagName,
            args: emberView.args
          };
        })()
      `
    });

    return result.value;
  }
}
```

#### **Stencil Integration**
```typescript
class StencilIntegration {
  async getStencilComponentData(nodeId: number): Promise<StencilComponent> {
    // Stencil components are web components with special metadata
    const result = await this.cdp.send('Runtime.evaluate', {
      expression: `
        (function() {
          const node = document.querySelector('[data-id="${nodeId}"]');

          // Stencil adds special metadata
          if (!node.constructor['COMPILER_META']) return null;

          return {
            tagName: node.tagName.toLowerCase(),
            properties: node.constructor.properties || {},
            states: node.__stencilInternalState || {}
          };
        })()
      `
    });

    return result.value;
  }
}
```

#### **Framework Priority & Detection**

The system detects frameworks in this priority order:

1. **React** - Most popular, check `__reactFiber` property
2. **Vue** - Check `__vue__` (v2) or `__vueParentComponent` (v3)
3. **Angular** - Check `window.ng` and `ng.getComponent()`
4. **Blazor** - Check `_bl_` attribute and `window.Blazor`
5. **Svelte** - Check `__svelte_` prefixed properties
6. **Solid** - Check `_$owner` property
7. **Lit/Web Components** - Check if custom element
8. **Alpine** - Check `_x_dataStack` property
9. **htmx** - Check for `hx-*` attributes
10. **Qwik** - Check for `q:*` attributes
11. **Ember** - Check `Ember.View.views`
12. **Stencil** - Check `COMPILER_META`
13. **Aurelia** - Check Aurelia view model bindings
14. **Preact** - Similar to React but check for Preact-specific properties
15. **Backbone** - Check for Backbone view properties

#### **Framework Support Matrix**

| Framework | State/Props | Source Mapping | Dev Mode Required | Notes |
|-----------|-------------|----------------|-------------------|-------|
| **React** | ✅ Full | ✅ Yes (_debugSource) | ⚠️ Development build | Fiber architecture, hooks visible |
| **Vue 2.x** | ✅ Full | ✅ Yes (__file) | ⚠️ Development build | Options API |
| **Vue 3.x** | ✅ Full | ✅ Yes (__file) | ⚠️ Development build | Composition API, setup() |
| **Angular** | ✅ Full | ✅ Yes | ✅ Always (Ivy) | ng.getComponent() API |
| **Blazor** | ✅ Parameters | ⚠️ Limited | ✅ Always | .NET assembly info, WASM/Server |
| **Svelte** | ✅ Full | ⚠️ Limited | ⚠️ Development build | Component internals |
| **Solid.js** | ✅ Signals | ⚠️ Limited | ⚠️ Development build | Signal tracking |
| **Lit** | ✅ Properties | ⚠️ Limited | ✅ Always | Web Components API |
| **Alpine** | ✅ Data | ❌ No | ✅ Always | Attribute-based |
| **htmx** | ✅ Attributes | ❌ No | ✅ Always | No components, pure attributes |
| **Qwik** | ✅ Props/Signals | ✅ Yes | ⚠️ Development build | Resumability, q:* attributes |
| **Ember** | ✅ Full | ⚠️ Limited | ⚠️ Development build | Classic framework |
| **Stencil** | ✅ Props/State | ⚠️ Limited | ⚠️ Development build | Web Components compiler |
| **Aurelia** | ✅ ViewModel | ⚠️ Limited | ⚠️ Development build | Binding context |
| **Preact** | ✅ Full | ✅ Yes | ⚠️ Development build | React-like, smaller |
| **Backbone** | ✅ Model/View | ❌ No | ✅ Always | Classic MVC |
| **Astro** | ✅ Props | ⚠️ Limited | ⚠️ Development build | Islands architecture |

**Legend**:
- ✅ Full support
- ⚠️ Partial support or requires specific conditions
- ❌ Not applicable or not supported

### 9.3 CSS Source Mapping

```typescript
// Map compiled CSS back to SCSS/Less source

interface CSSSourceMap {
  // Runtime CSS
  compiledFile: string;      // "dist/styles.css"
  compiledLine: number;      // 1234

  // Original source
  sourceFile: string;        // "src/styles/button.scss"
  sourceLine: number;        // 45
  sourceColumn: number;      // 2

  // Original code
  originalSource: string;    // ".button { color: $primary-color; }"

  // Preprocessor chain
  preprocessors: Array<'scss' | 'less' | 'postcss' | 'css-in-js'>;
}
```

### 9.4 Stack Trace Mapping

```typescript
// Map runtime stack traces to TypeScript source

interface MappedStackTrace {
  frames: Array<{
    // Runtime location
    runtimeFile: string;
    runtimeLine: number;
    runtimeColumn: number;

    // Original source (TypeScript)
    sourceFile: string;
    sourceLine: number;
    sourceColumn: number;

    // Code context
    sourceSnippet: string;

    // Function/component info
    functionName: string;
    componentName?: string;
  }>;
}
```

---

## 10. Query Optimization

### 10.1 Caching Strategy

**Three-Tier Cache Architecture**:

```typescript
class MultiTierCache {
  // L1: Hot cache (5MB, <1ms access)
  private l1Cache: LRUCache<string, any>;

  // L2: Warm cache (50MB, ~5ms access)
  private l2Cache: LRUCache<string, any>;

  // L3: Cold cache (disk/IndexedDB, ~50ms access)
  private l3Cache: DiskCache;

  async get(key: string): Promise<any> {
    // Try L1
    const hot = this.l1Cache.get(key);
    if (hot) return hot;

    // Try L2
    const warm = this.l2Cache.get(key);
    if (warm) {
      this.l1Cache.set(key, warm);  // Promote to L1
      return warm;
    }

    // Try L3
    const cold = await this.l3Cache.get(key);
    if (cold) {
      this.l2Cache.set(key, cold);  // Promote to L2
      return cold;
    }

    return null;  // Cache miss
  }
}
```

**Cache Invalidation**:

```typescript
class SmartCacheInvalidation {
  constructor(private cdp: ICDPClient) {
    // Invalidate on DOM mutations
    cdp.on('DOM.setChildNodes', (event) => {
      this.invalidateSubtree(event.parentId);
    });

    cdp.on('DOM.attributeModified', (event) => {
      if (event.name === 'class' || event.name === 'style') {
        this.invalidateNode(event.nodeId);
      }
    });

    // Invalidate on stylesheet changes
    cdp.on('CSS.styleSheetChanged', (event) => {
      this.invalidateStylesheet(event.styleSheetId);
    });
  }

  private invalidateSubtree(nodeId: number): void {
    // Only invalidate affected subtree, not entire cache
  }
}
```

### 10.2 Request Batching

```typescript
// Batch multiple queries into single round-trip

Tool: batch_query

Request:
{
  "queries": [
    { "type": "get_element", "selector": ".submit-button" },
    { "type": "trace_css", "selector": ".submit-button", "property": "display" },
    { "type": "get_component_state", "component": "SubmitForm" }
  ]
}

Response:
{
  "results": [
    { "queryIndex": 0, "data": { /* element data */ } },
    { "queryIndex": 1, "data": { /* cascade trace */ } },
    { "queryIndex": 2, "data": { /* component state */ } }
  ]
}
```

### 10.3 Protocol-Level Optimizations

**Command Batching**:
```typescript
// Send multiple CDP commands in one batch
await cdpClient.sendBatch([
  { domain: 'DOM', method: 'querySelectorAll', params: { selector: '.error' } },
  { domain: 'CSS', method: 'getMatchedStylesForNode', params: { nodeId } },
  { domain: 'CSS', method: 'getComputedStyleForNode', params: { nodeId } }
]);
```

**Request Deduplication**:
```typescript
// If same query made twice rapidly, return same promise
class RequestDeduplicator {
  private inFlight = new Map<string, Promise<any>>();

  async request<T>(key: string, executor: () => Promise<T>): Promise<T> {
    if (this.inFlight.has(key)) {
      return this.inFlight.get(key) as Promise<T>;
    }

    const promise = executor().finally(() => {
      this.inFlight.delete(key);
    });

    this.inFlight.set(key, promise);
    return promise;
  }
}
```

### 10.4 Data Compression

**Smart Filtering**:
```typescript
// Only return relevant DOM nodes, not entire tree

{
  "dom": {
    "target": { /* the queried element */ },
    "parents": [ /* ancestors for context */ ],
    "children": [ /* only if relevant to query */ ]
  },
  "stats": {
    "totalNodes": 10000,
    "returnedNodes": 15,
    "omittedNodes": 9985
  }
}
```

**Streaming for Large Data**:
```typescript
// Stream large DOM tree in chunks

Response 1 (immediate):
{
  "status": "streaming",
  "totalNodes": 10000,
  "chunkSize": 100
}

Response 2-101 (streamed):
{
  "chunk": 1,
  "nodes": [ /* 100 nodes */ ]
}
```

---

## 11. Performance Requirements

### 11.1 Latency Targets

| Operation | Target Latency | Strategy |
|-----------|----------------|----------|
| **Console query** | < 30ms | Circular buffer, indexed by level |
| **DOM query (single element)** | < 50ms | Flat node map, O(1) lookup |
| **CSS trace (single property)** | < 100ms | Cached cascade chains |
| **Full DOM tree** | < 200ms | Streaming, compression |
| **Component state** | < 30ms | Direct DevTools hook access |
| **Network query** | < 50ms | Indexed by URL/status |
| **Batch query (5 items)** | < 200ms | Parallel execution |
| **Snapshot capture** | < 150ms | Hash-based fast comparison |

### 11.2 Throughput Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| **Console messages** | 1000+ msg/sec | Circular buffer, memory-bounded |
| **DOM mutations** | 500+ mutations/sec | Batched event processing |
| **Network requests** | 100+ req/sec | Indexed storage |
| **Cache hit rate** | > 80% | Smart caching, predictive preload |
| **Memory usage** | < 100MB | Bounded buffers, weak refs |

### 11.3 Optimization Checklist

```typescript
interface OptimizationConfig {
  // Protocol Level
  protocol: {
    commandBatching: boolean;              // ✓ Batch commands
    binaryMode: boolean;                   // ✓ Use binary for large payloads
    compression: 'none' | 'gzip' | 'zstd'; // ✓ Compress responses
    connectionPooling: boolean;            // ✓ Reuse connections
    requestDeduplication: boolean;         // ✓ Coalesce duplicates
  };

  // Caching
  caching: {
    enabled: boolean;
    l1SizeMB: number;                      // ✓ Hot cache size
    l2SizeMB: number;                      // ✓ Warm cache size
    l3Enabled: boolean;                    // ✓ Disk cache
    ttlMs: Record<string, number>;         // ✓ Per-domain TTLs
    granularInvalidation: boolean;         // ✓ Selective invalidation
  };

  // Data Structures
  dataStructures: {
    circularBuffers: boolean;              // ✓ Bounded growth
    indexedCollections: boolean;           // ✓ Fast lookups
    flatDOMTree: boolean;                  // ✓ O(1) node access
  };

  // Event Bus
  eventBus: {
    filterAtSource: boolean;               // ✓ Filter before publish
    eventBatching: boolean;                // ✓ Batch rapid events
    lazySubscription: boolean;             // ✓ Enable domains on-demand
  };

  // Memory Management
  memory: {
    maxBufferSizeMB: number;               // ✓ Memory-bounded buffers
    weakMapCaching: boolean;               // ✓ GC-friendly caches
    lazyParsing: boolean;                  // ✓ Parse on access
  };
}
```

---

## 12. Technology Stack

### 12.1 Core Technologies

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Language** | TypeScript | 5.3+ | Type safety, MCP ecosystem standard |
| **Runtime** | Node.js | 18+ | CDP client libraries, MCP SDK support |
| **MCP SDK** | @modelcontextprotocol/sdk | Latest | Official TypeScript SDK |
| **CDP Client** | chrome-remote-interface | Latest | Battle-tested CDP client |
| **WebKit Client** | playwright-webkit (protocol layer) | Latest | Reuse Playwright's WebInspector impl |
| **Firefox Client** | Custom or firefox-client | Latest | RDP client |
| **Event Bus** | EventEmitter3 | Latest | Lightweight pub/sub |
| **DI Container** | TSyringe | Latest | ISP requirement, interface injection |

### 12.2 Development Tools

| Tool | Purpose |
|------|---------|
| **pnpm** | Monorepo package management |
| **Turborepo** | Build orchestration |
| **tsup** | Fast TypeScript bundling |
| **Vitest** | Unit testing |
| **Playwright** | Integration testing (real browsers) |
| **ESLint** | Linting |
| **Prettier** | Code formatting |

### 12.3 Testing Infrastructure

```yaml
# docker-compose.test.yml
services:
  chrome:
    image: browserless/chrome:latest
    ports:
      - "9222:9222"
    environment:
      MAX_CONCURRENT_SESSIONS: 5
      CONNECTION_TIMEOUT: 600000

  firefox:
    image: browserless/firefox:latest
    ports:
      - "6000:6000"

  # WebKit requires macOS for Safari testing
```

---

## 13. Package Structure

### 13.1 Monorepo Layout

```
browser-mcp/
├── packages/
│   ├── contracts/              # @browser-mcp/contracts
│   │   ├── bridges/           # All bridge interfaces
│   │   ├── protocol/          # Protocol abstraction
│   │   ├── types/             # Shared types
│   │   └── events/            # Event contracts
│   │
│   ├── core/                   # @browser-mcp/core
│   │   ├── domain/            # Business logic
│   │   └── adapters/          # Protocol adapters
│   │
│   ├── chromium/               # @browser-mcp/chromium
│   │   ├── protocol/          # CDP client
│   │   ├── bridges/           # CDP bridges
│   │   └── browser/           # Chrome launcher
│   │
│   ├── webkit/                 # @browser-mcp/webkit
│   │   ├── protocol/          # WebInspector client
│   │   ├── bridges/           # WebKit bridges
│   │   └── browser/           # Safari launcher
│   │
│   ├── firefox/                # @browser-mcp/firefox
│   │   ├── protocol/          # RDP client
│   │   ├── bridges/           # Firefox bridges
│   │   └── browser/           # Firefox launcher
│   │
│   ├── extension-chromium/     # ⭐ BROWSER EXTENSION (PRIMARY)
│   │   ├── manifest.json      # Chrome manifest v3
│   │   ├── background/
│   │   │   ├── service-worker.ts    # MCP server embedded
│   │   │   ├── tab-manager.ts       # Tab lifecycle
│   │   │   └── filesystem-provider.ts  # Virtual FS
│   │   ├── content/
│   │   │   └── content-script.ts    # Injected into tabs
│   │   ├── popup/
│   │   │   ├── popup.html
│   │   │   ├── popup.ts
│   │   │   └── popup.css
│   │   ├── icons/
│   │   │   ├── icon-16.png
│   │   │   ├── icon-48.png
│   │   │   └── icon-128.png
│   │   └── assets/
│   │
│   ├── extension-firefox/      # Firefox extension (Manifest v3/v2)
│   │   ├── manifest.json
│   │   └── ... (similar structure)
│   │
│   ├── extension-safari/       # Safari extension (Xcode project)
│   │   ├── BrowserInspector.xcodeproj
│   │   ├── Extension/
│   │   └── ... (Swift + JS)
│   │
│   ├── server-chromium/        # @browser-mcp/server-chromium (CLI mode)
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── MCPServer.ts
│   │   │   ├── ResourceProviders.ts
│   │   │   └── ToolProviders.ts
│   │   └── bin/
│   │       └── chromium-mcp.ts
│   │
│   ├── server-webkit/          # @browser-mcp/server-webkit (CLI mode)
│   └── server-firefox/         # @browser-mcp/server-firefox (CLI mode)
│
├── examples/
│   ├── extension-demo.md       # Extension usage examples
│   ├── cli-chromium-basic.ts   # CLI mode examples
│   └── cross-browser-test.ts
│
├── docs/
│   ├── architecture.md
│   ├── extension-guide.md      # ⭐ NEW: Extension user guide
│   ├── cli-guide.md            # CLI mode guide
│   ├── chromium-guide.md
│   ├── webkit-guide.md
│   └── firefox-guide.md
│
├── store-assets/               # ⭐ NEW: Extension store assets
│   ├── chrome/
│   │   ├── screenshots/
│   │   ├── promo-images/
│   │   └── description.md
│   ├── firefox/
│   └── safari/
│
├── docker/
│   └── docker-compose.test.yml
│
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.base.json
```

### 13.2 Dependency Graph

```
server-chromium ────┐
                    │
server-webkit ──────┼────> core ────> contracts
                    │
server-firefox ─────┘


chromium ────┐
             │
webkit ──────┼────> core ────> contracts
             │
firefox ─────┘
```

**Critical**: `contracts` package has ZERO dependencies (per .cursorrules)

---

## 14. Implementation Phases

### 14.1 Phase 1: Foundation + Browser Extension Shell (Weeks 1-2)

**Goals**: Project infrastructure, core abstractions, and basic extension

**Deliverables**:
- [ ] Monorepo setup (pnpm + Turborepo)
- [ ] `@browser-mcp/contracts` package with all interfaces
- [ ] `@browser-mcp/core` package with shared logic
- [ ] Event bus implementation (EventEmitter3)
- [ ] Basic CDP client connection
- [ ] **Browser extension shell** (Chrome manifest v3)
  - [ ] Background service worker
  - [ ] Content script injection
  - [ ] Popup UI (activate/deactivate)
  - [ ] chrome.debugger API integration
- [ ] CLI test harness for manual testing

**Success Criteria**:
- Extension installs in Chrome
- Can activate extension on a tab
- Extension connects to chrome.debugger API
- Can send CDP commands via extension
- Event bus working with basic pub/sub

---

### 14.2 Phase 2: Chromium Console & DOM (Weeks 3-4)

**Goals**: First two domains fully functional

**Console Domain**:
- [ ] Console bridge implementation
- [ ] Console message capture with full fidelity
- [ ] Stack trace preservation
- [ ] Console resource providers
- [ ] Console tools (evaluate, filter, clear)
- [ ] Integration tests with real Chrome

**DOM Domain**:
- [ ] DOM bridge implementation
- [ ] CSS selector queries
- [ ] Full DOM tree extraction
- [ ] Element property inspection
- [ ] DOM resource providers
- [ ] DOM tools (query, get context)

**Success Criteria**:
- AI can query console errors with stack traces
- AI can query DOM elements with properties
- Sub-50ms response times for cached queries

---

### 14.3 Phase 3: Chromium CSS & Source Mapping (Weeks 5-6)

**Goals**: CSS cascade tracing and source mapping

**CSS Domain**:
- [ ] CSS bridge implementation
- [ ] Cascade tracing (key feature)
- [ ] Visibility analysis
- [ ] Specificity calculation
- [ ] CSS resource providers
- [ ] CSS tools (trace, analyze visibility)

**Source Mapping Domain**:
- [ ] Source bridge implementation
- [ ] React DevTools integration
- [ ] Vue DevTools integration
- [ ] Source map parsing
- [ ] DOM → source mapping
- [ ] Source → DOM reverse mapping

**Success Criteria**:
- AI can trace CSS property through cascade
- AI can map DOM element to source file
- Visibility analysis identifies blockers

---

### 14.4 Phase 4: Chromium Network & Performance (Week 7)

**Goals**: Network monitoring and performance metrics

**Network Domain**:
- [ ] Network bridge implementation
- [ ] Request/response capture
- [ ] Timing information
- [ ] Network resource providers
- [ ] Network tools (query, filter)

**Performance Domain**:
- [ ] Performance bridge implementation
- [ ] Core Web Vitals collection
- [ ] Performance trace capture
- [ ] Performance resource providers
- [ ] Performance tools (metrics, trace)

**Success Criteria**:
- AI can query network requests with timing
- AI can get Core Web Vitals
- Sub-100ms response times

---

### 14.5 Phase 5: Virtual Filesystem & MCP Integration (Week 8)

**Goals**: Virtual filesystem representation + embedded MCP server in extension

**Deliverables**:
- [ ] **Virtual filesystem implementation**
  - [ ] browser://tab-{id}/ mount point structure
  - [ ] Filesystem-like resource providers (read files from browser state)
  - [ ] console/messages, dom/tree.html, components/*/state.json
- [ ] **MCP server embedded in extension**
  - [ ] Background worker MCP server
  - [ ] Native messaging bridge (extension ↔ AI assistant)
  - [ ] Auto-discovery of active tabs
  - [ ] Tab lifecycle management (mount/unmount)
- [ ] **Extension UI improvements**
  - [ ] Show mounted filesystem path
  - [ ] Display active resources
  - [ ] "Copy path" button for easy AI queries
- [ ] End-to-end tests (extension → MCP → AI client)

**Success Criteria**:
- Extension exposes virtual filesystem via MCP
- AI assistant auto-discovers browser://tab-localhost-3000/
- AI can read browser state like files
- Multi-tab support working
- Zero manual configuration required

---

### 14.6 Phase 6: WebKit Implementation (Weeks 9-11)

**Goals**: Safari/WebKit support

**Deliverables**:
- [ ] `@browser-mcp/webkit` package
- [ ] WebInspector protocol client
- [ ] All bridges (reuse core logic)
- [ ] WebKit-specific adapters
- [ ] `@browser-mcp/server-webkit`
- [ ] Safari connection manager
- [ ] Integration tests (macOS required)

**Success Criteria**:
- Feature parity with Chromium server
- Works with Safari and WebKit GTK
- Source mapping works

---

### 14.7 Phase 7: Firefox Implementation (Weeks 12-14)

**Goals**: Firefox support

**Deliverables**:
- [ ] `@browser-mcp/firefox` package
- [ ] RDP protocol client
- [ ] All bridges (reuse core logic)
- [ ] Firefox-specific adapters
- [ ] `@browser-mcp/server-firefox`
- [ ] Firefox connection manager
- [ ] Integration tests

**Success Criteria**:
- Feature parity with Chromium/WebKit
- Works with Firefox stable
- Source mapping works

---

### 14.8 Phase 8: Extension Publishing & Distribution (Week 15)

**Goals**: Publish extensions to official stores

**Deliverables**:
- [ ] **Chrome Extension**
  - [ ] Chrome Web Store listing
  - [ ] Store assets (screenshots, promo images)
  - [ ] Privacy policy
  - [ ] Review and publish
- [ ] **Firefox Extension**
  - [ ] Manifest v3 port (or v2 compatibility)
  - [ ] Firefox Add-ons listing
  - [ ] Mozilla review process
- [ ] **Safari Extension**
  - [ ] Xcode project setup
  - [ ] Safari Extensions Gallery submission
  - [ ] App Store review (if required)
- [ ] **Documentation**
  - [ ] User guide (install, activate, use)
  - [ ] AI assistant integration guides (Claude, Cursor, etc.)
  - [ ] Video walkthrough
  - [ ] Troubleshooting FAQ
- [ ] **Marketing**
  - [ ] GitHub repository with examples
  - [ ] Blog post / announcement
  - [ ] Demo video

**Success Criteria**:
- Extension available on Chrome Web Store
- Extension available on Firefox Add-ons
- Extension available for Safari
- Clear installation instructions
- Video demo showing zero-config workflow

---

### 14.9 Phase 9: Cross-Browser Testing & Validation (Week 16)

**Goals**: Validation and performance benchmarking

**Deliverables**:
- [ ] Multi-browser test suite
- [ ] Feature parity validation (Chrome vs Firefox vs Safari)
- [ ] Performance benchmarking
- [ ] Edge case testing (framework detection, source mapping)
- [ ] Beta user feedback incorporation

**Success Criteria**:
- 95%+ feature parity across browsers
- All tests passing
- Sub-100ms query latency validated
- Positive user feedback

---

## 15. Testing Strategy

### 15.1 Testing Principles (Per .cursorrules)

**NEVER use mocks when real implementation is feasible**

Use **real browser instances** for testing:
- Chrome via Docker (browserless/chrome)
- Firefox via Docker (browserless/firefox)
- Safari via local macOS instance

### 15.2 Test Categories

**Unit Tests** (Vitest):
```typescript
// Test individual bridges with real browser
describe('ConsoleBridge', () => {
  let browser: Browser;
  let cdpClient: ICDPClient;
  let consoleBridge: IConsoleBridge;

  beforeEach(async () => {
    browser = await chromium.launch({ args: ['--remote-debugging-port=9222'] });
    cdpClient = new CDPClient('http://localhost:9222');
    consoleBridge = new ConsoleBridge(cdpClient);
  });

  it('should capture console.error with stack trace', async () => {
    const page = await browser.newPage();
    await page.evaluate(() => {
      console.error('Test error', new Error('Stack trace test'));
    });

    const messages = await consoleBridge.getMessages({ level: 'error' });
    expect(messages).toHaveLength(1);
    expect(messages[0].text).toContain('Test error');
    expect(messages[0].stackTrace).toBeDefined();
  });
});
```

**Integration Tests** (Vitest + Playwright):
```typescript
// Test multiple bridges working together
describe('CSS Visibility Analysis', () => {
  it('should trace display:none through cascade', async () => {
    const page = await browser.newPage();
    await page.setContent(`
      <style>
        .hidden { display: none; }
        .button { display: flex; }
      </style>
      <button class="button hidden">Submit</button>
    `);

    const visibility = await cssBridge.analyzeVisibility('.button');
    expect(visibility.visible).toBe(false);

    const trace = await cssBridge.traceStyleProperty('.button', 'display');
    expect(trace.finalValue).toBe('none');
    expect(trace.cascade).toHaveLength(2);
  });
});
```

**End-to-End Tests** (MCP client):
```typescript
// Test complete MCP protocol flow
describe('MCP End-to-End', () => {
  it('should debug visibility via MCP', async () => {
    const mcpClient = new MCPClient('http://localhost:3000');

    const result = await mcpClient.callTool('debug_visibility', {
      selector: '.submit-button'
    });

    expect(result.visible).toBe(false);
    expect(result.blockers).toHaveLength(1);
    expect(result.blockers[0].type).toBe('display-none');
  });
});
```

### 15.3 Test Infrastructure

```yaml
# docker-compose.test.yml
services:
  chrome:
    image: browserless/chrome:latest
    ports:
      - "9222:9222"
    environment:
      MAX_CONCURRENT_SESSIONS: 5

  firefox:
    image: browserless/firefox:latest
    ports:
      - "6000:6000"
```

### 15.4 Coverage Targets

- **Unit tests**: > 80% coverage
- **Integration tests**: All cross-domain interactions
- **E2E tests**: All MCP tools and resources
- **Real browser tests**: 100% (no mocks)

---

## 16. Success Metrics

### 16.1 Functional Metrics

- [ ] AI can query console without copy/paste
- [ ] AI can inspect DOM without screenshots
- [ ] AI can trace CSS cascade to source files
- [ ] AI can debug visibility issues
- [ ] AI can monitor network requests
- [ ] AI can access component state (React/Vue)
- [ ] AI can map DOM to source files

### 16.2 Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| **Console query latency (p50)** | < 30ms | Histogram |
| **DOM query latency (p50)** | < 50ms | Histogram |
| **CSS trace latency (p50)** | < 100ms | Histogram |
| **Full DOM tree latency (p95)** | < 200ms | Histogram |
| **Cache hit rate** | > 80% | Counter |
| **Memory usage** | < 100MB | Gauge |
| **Throughput (console msgs)** | > 1000/sec | Counter |

### 16.3 Quality Metrics

- [ ] Zero data loss (console messages, network requests)
- [ ] 95%+ feature parity across browsers
- [ ] < 5% error rate on queries
- [ ] 100% source mapping accuracy (when available)

### 16.4 Adoption Metrics

- [ ] Used by developers in real debugging sessions
- [ ] Reduces time to debug by 50%+
- [ ] Reduces context switches (browser ↔ editor)
- [ ] Positive feedback from beta testers

---

## 17. Architecture Decision Records

### 17.1 ADR-001: Use Native Browser Protocols (CDP/WebInspector/RDP)

**Decision**: Base all browser inspection on native debugging protocols rather than browser extensions or custom instrumentation

**Rationale**:
- Industry standard protocols
- Stable, versioned APIs
- Direct browser access without intermediaries
- Same protocols used by DevTools
- No user installation required (beyond launching browser with flag)

**Alternatives Considered**:
- Browser extension APIs (limited capabilities, requires installation)
- Selenium WebDriver (higher abstraction, less fidelity)
- Custom instrumentation (maintenance burden, compatibility issues)

**Status**: Accepted

---

### 17.2 ADR-002: Interface Segregation in Separate Project

**Decision**: All interfaces in `contracts/` package with zero implementations

**Rationale**:
- .cursorrules mandatory ISP requirement
- Immutable contract versioning
- Clear compilation boundaries
- Independent interface evolution
- Prevents tight coupling

**Alternatives Considered**:
- Interfaces alongside implementations (violates .cursorrules)
- No interfaces (breaks ISP principle)

**Status**: Accepted

---

### 17.3 ADR-003: Start with EventEmitter3, Not Distributed Event Bus

**Decision**: Use in-memory EventEmitter3 for event bus

**Rationale**:
- .cursorrules: "Do NOT overcomplicate. Keep it simple."
- MVP is local development, not distributed systems
- EventEmitter3 is battle-tested, lightweight
- Easy to upgrade to Redis/Kafka later if needed
- No external dependencies (Redis, Kafka)

**Alternatives Considered**:
- Redis pub/sub (overkill for local MVP)
- Apache Kafka (massive over-engineering)
- RabbitMQ (unnecessary complexity)

**Status**: Accepted

---

### 17.4 ADR-004: Real Browser Instances for Testing

**Decision**: NO MOCKS - Use real Chrome/Firefox via Docker/Playwright

**Rationale**:
- .cursorrules: "NEVER use mocks when a real local implementation is feasible"
- Browser behavior can only be validated against real browsers
- Catches integration issues early
- Source maps, DevTools integrations require real browsers
- Docker makes this practical

**Alternatives Considered**:
- Mocked CDP responses (violates .cursorrules, unreliable)
- Headless browser without debugging (can't test CDP)

**Status**: Accepted

---

### 17.5 ADR-005: Multi-Browser Support via Protocol Abstraction

**Decision**: Create browser-agnostic interface layer (`IProtocolClient`, bridge interfaces) with browser-specific implementations

**Rationale**:
- Maximize code reuse across browsers (70%+ shared code)
- Unified MCP experience for AI agents
- Easier to add new browsers in future
- Clear separation between protocol and business logic

**Alternatives Considered**:
- Separate codebases per browser (massive duplication)
- Single server supporting all browsers (tight coupling)

**Status**: Accepted

---

### 17.6 ADR-006: Monorepo with pnpm Workspaces + Turborepo

**Decision**: Use pnpm workspaces + Turborepo for managing multiple packages

**Rationale**:
- Shared contracts package prevents interface drift
- Efficient dependency management (pnpm hard links)
- Parallel builds for faster CI/CD (Turborepo)
- Easier to version packages independently
- Industry standard for TypeScript monorepos

**Alternatives Considered**:
- Separate repos per browser (coordination overhead)
- Single repo without workspaces (dependency hell)
- Lerna (less maintained, slower than Turborepo)

**Status**: Accepted

---

### 17.7 ADR-007: Data Provider Pattern (No Embedded AI)

**Decision**: MCP server only extracts and structures data; external LLM does all analysis

**Rationale**:
- Core purpose is high-fidelity data extraction
- External LLM (Claude, GPT) is more capable than local LLM
- Avoids 2-3GB model downloads
- Faster responses (no LLM inference latency)
- Simpler architecture (single responsibility)
- Lower resource requirements (no GPU needed)

**Alternatives Considered**:
- Embedded local LLM for analysis (over-engineering, adds latency)
- Pattern detection in MCP server (scope creep)

**Status**: Accepted

---

### 17.8 ADR-008: Browser State as Queryable Data (Not Tree Traversal)

**Decision**: Present browser state as flat maps with indexes, not nested trees requiring traversal

**Rationale**:
- Mimics file system mental model (files, not directory traversal)
- O(1) lookups instead of O(n) tree traversal
- Easier for LLM to query (SQL-like)
- Pre-computed indexes for common queries
- Smaller data payloads (only return relevant nodes)

**Alternatives Considered**:
- Return full DOM tree (verbose, slow)
- Require client-side traversal (adds latency)

**Status**: Accepted

---

### 17.9 ADR-009: Progressive Disclosure (Summary → Details → Full)

**Decision**: Return data in layers: summary (always), details (on request), full (explicit request)

**Rationale**:
- Minimizes data transfer (most queries only need summary)
- Faster response times
- LLM can request more detail if needed
- Avoids overwhelming LLM with unnecessary data

**Alternatives Considered**:
- Always return full data (slow, wasteful)
- Multiple tool calls (more latency)

**Status**: Accepted

---

### 17.10 ADR-010: Source Mapping as First-Class Feature

**Decision**: Every DOM node and CSS rule includes source file:line mapping

**Rationale**:
- Core innovation of this project
- Enables AI to correlate runtime with source code
- No other tool provides this unified view
- Essential for debugging React/Vue/Angular apps
- Leverages existing source maps

**Alternatives Considered**:
- Optional source mapping (loses key value prop)
- Post-hoc mapping (adds latency)

**Status**: Accepted

---

## Appendix A: Protocol References

### Chromium
- **Chrome DevTools Protocol**: https://chromedevtools.github.io/devtools-protocol/
- **Canonical Definitions**: browser_protocol.pdl, js_protocol.pdl
- **Versions**: Stable (subset), ToT (tip-of-tree, full capabilities)

### WebKit
- **WebKit Remote Inspector**: Documented in WebKit source tree
- **Protocol Version**: Tied to WebKit/Safari releases

### Firefox
- **Remote Debugging Protocol**: https://firefox-source-docs.mozilla.org/devtools/backend/protocol.html
- **Future**: Transitioning to WebDriver BiDi

---

## Appendix B: Example User Workflows

### Example 1: Debug Hidden Button

```
Developer: "My submit button isn't showing up"

AI: [Calls MCP tool: debug_visibility('.submit-button')]

Response:
{
  "visible": false,
  "blockers": [
    {
      "type": "display-none",
      "property": "display",
      "value": "none",
      "source": {
        "file": "src/styles/utils.css",
        "line": 234,
        "selector": ".hidden"
      }
    }
  ],
  "sourceReference": {
    "file": "src/components/Form.tsx",
    "line": 45,
    "snippet": "<button className={`submit-button ${isLoading ? 'hidden' : ''}`}>",
    "componentState": {
      "isLoading": true
    }
  }
}

AI: "Your button is hidden because:
1. It has class 'hidden' which applies display:none (utils.css:234)
2. The class is added when isLoading=true (Form.tsx:45)
3. isLoading is currently true

Check why isLoading is stuck at true."
```

### Example 2: Debug CSS Color Conflict

```
Developer: "Why is my heading blue instead of red?"

AI: [Calls MCP tool: trace_css_property('h1.title', 'color')]

Response:
{
  "property": "color",
  "finalValue": "rgb(0, 0, 255)",
  "cascade": [
    {
      "value": "red",
      "source": {
        "file": "src/styles/typography.scss",
        "line": 45,
        "selector": ".title"
      },
      "specificity": { "classes": 1, "total": 10 },
      "applied": false,
      "overriddenBy": { "selector": ".dashboard .title" }
    },
    {
      "value": "blue",
      "source": {
        "file": "src/styles/theme.scss",
        "line": 89,
        "selector": ".dashboard .title"
      },
      "specificity": { "classes": 2, "total": 20 },
      "applied": true
    }
  ]
}

AI: "Your heading is blue because of specificity:
1. typography.scss:45 sets .title { color: red } (specificity 0,1,0)
2. theme.scss:89 sets .dashboard .title { color: blue } (specificity 0,2,0)

The second rule wins due to higher specificity.

Fix: Change typography.scss to .dashboard .title { color: red }"
```

---

## Appendix C: Configuration Examples

### Claude Desktop Config

```json
{
  "mcpServers": {
    "chrome-debug": {
      "command": "npx",
      "args": [
        "@browser-mcp/server-chromium@latest",
        "--attach",
        "--port=9222"
      ]
    },
    "safari-debug": {
      "command": "npx",
      "args": [
        "@browser-mcp/server-webkit@latest",
        "--attach"
      ]
    }
  }
}
```

### Launch Chrome with Debugging

```bash
# macOS
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/chrome-debug

# Linux
google-chrome --remote-debugging-port=9222

# Windows
chrome.exe --remote-debugging-port=9222
```

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-01-05 | Architect | Initial complete requirements document |

---

**End of Requirements Document**
