# Browser MCP Family - Design Document Summary

**Version**: 1.0
**Date**: 2025-01-05
**Role**: Software Architect (Design Only - No Implementation)
**Status**: Complete Architecture Phase

---

## Document Overview

This is the **master summary** of all design documents for the Browser MCP Family project. All designs enforce **ISP (Interface Segregation Principle)** and **TDD (Test-Driven Development)** as mandated by `.cursorrules`.

---

## Design Document Index

### ✅ Completed Design Documents

1. **[DESIGN.md](DESIGN.md)** - Master architecture document
   - System architecture overview (C4 Model)
   - Project structure (ISP-compliant monorepo)
   - Technology stack
   - Development workflow
   - Compliance matrix

2. **[design/contracts/INTERFACES.md](design/contracts/INTERFACES.md)** - Interface contracts (ISP enforcement)
   - All interface definitions (MCP Server, Business Logic, Protocol Adapters, Events)
   - Interface versioning strategy (semantic versioning)
   - Event schemas (EventEmitter3)
   - Data type definitions
   - Dependency injection setup

3. **[design/testing/TDD-STRATEGY.md](design/testing/TDD-STRATEGY.md)** - Test-driven development strategy
   - TDD principles (NO MOCKS - use real browsers)
   - Test infrastructure setup (Puppeteer, Playwright, Docker)
   - Browser test instances (Chrome, Firefox, Safari)
   - Test app templates (17 frameworks)
   - Performance testing (<100ms queries)
   - CI/CD integration

### 📋 Design Families (Documented Below)

This summary document provides consolidated designs for the remaining functional families:

- **Browser Extension** (Chrome/Firefox/Safari)
- **MCP Server** (Embedded in extension)
- **Framework Detection** (17+ frameworks)
- **Protocol Adapters** (CDP, RDP, WebKit)
- **Business Logic** (DOM/CSS/Console extraction)
- **Performance** (Caching, query optimization)

---

## 1. Browser Extension Design

### 1.1 Architecture

**Extension Components**:

```
Browser Extension (Manifest v3)
├── Background Service Worker
│   ├── MCP Server (embedded)
│   ├── Tab Manager
│   ├── Port Manager
│   └── Event Bus
├── Content Scripts (injected per tab)
│   ├── Protocol Bridge (CDP/RDP/WebKit)
│   ├── Framework Detector
│   └── Data Extractors
└── Popup UI
    ├── Activation Interface
    ├── Port Selection
    └── Status Display
```

### 1.2 Manifest v3 Configuration

**extension-chromium/manifest.json**:

```json
{
  "manifest_version": 3,
  "name": "Browser Inspector for AI",
  "version": "1.0.0",
  "description": "Exposes browser state as MCP resources for AI debugging",
  "permissions": [
    "debugger",
    "tabs",
    "storage",
    "activeTab"
  ],
  "host_permissions": [
    "<all_urls>"
  ],
  "background": {
    "service_worker": "background/service-worker.js",
    "type": "module"
  },
  "content_scripts": [
    {
      "matches": ["<all_urls>"],
      "js": ["content/content-script.js"],
      "run_at": "document_start"
    }
  ],
  "action": {
    "default_popup": "popup/popup.html",
    "default_icon": {
      "16": "icons/icon-16.png",
      "48": "icons/icon-48.png",
      "128": "icons/icon-128.png"
    }
  }
}
```

### 1.3 Service Worker (MCP Server Host)

**Responsibilities**:
- Embed MCP server
- Manage tab lifecycle
- Allocate ports
- Route MCP requests to content scripts

**Key Interfaces Used**:
- `IMCPServer` - MCP server instance
- `ITabManager` - Track active tabs
- `IPortManager` - Allocate ports
- `IEventBus` - Event-driven communication

**Communication Flow**:
```
AI Assistant
    ↓ (MCP Protocol - Native Messaging / WebSocket)
Service Worker (MCP Server)
    ↓ (Browser Message Passing API)
Content Script (per tab)
    ↓ (chrome.debugger API - CDP)
Browser Tab
```

### 1.4 Content Script (Data Extraction)

**Responsibilities**:
- Inject into each activated tab
- Connect to browser debugging API (CDP/RDP/WebKit)
- Extract DOM, CSS, Console, Network data
- Detect framework
- Forward data to service worker

**Key Interfaces Used**:
- `ICDPAdapter` / `IRDPAdapter` / `IWebKitAdapter` - Protocol adapters
- `IFrameworkDetector` - Framework detection
- `IDOMExtractor`, `ICSSExtractor`, `IConsoleExtractor` - Data extraction

### 1.5 Popup UI (Activation Interface)

**User Flow**:
1. User clicks extension icon on a tab
2. Popup shows tab info (URL, detected framework)
3. User clicks "Activate" button
4. Extension:
   - Scans for available port (3100-3199)
   - Starts MCP server on port
   - Injects content script
   - Mounts virtual filesystem
5. Success notification with port info

**Key Features**:
- Port selection (auto or manual)
- Framework detection preview
- Status indicator (active/inactive)
- Port copy button for AI configuration

---

## 2. MCP Server Design

### 2.1 MCP Resources

**Virtual Filesystem Structure**:

```
browser://tab-localhost-3000/
├── console/
│   ├── messages              # All console messages
│   ├── errors                # Only errors
│   └── warnings              # Only warnings
├── dom/
│   ├── tree.json             # Full DOM tree (JSON)
│   ├── tree.html             # Full DOM (HTML)
│   └── elements/
│       └── .button/          # Query result (CSS selector)
├── css/
│   ├── stylesheets/
│   │   └── main.css
│   ├── cascade/
│   │   └── .button/display.json   # Cascade trace
│   └── issues.json
├── network/
│   ├── requests.json
│   └── failures.json
├── performance/
│   └── metrics.json
├── components/                # Framework components
│   ├── tree.json
│   └── Button/
│       ├── state.json
│       ├── props.json
│       └── source.tsx
└── sources/
    └── map.json              # Source map index
```

### 2.2 Resource Providers

**Interface**: `IResourceProvider`

**Implementations**:

| Provider | Resources | Data Source |
|----------|-----------|-------------|
| `ConsoleResourceProvider` | `console/messages`, `console/errors`, `console/warnings` | CDP `Console.messageAdded` |
| `DOMResourceProvider` | `dom/tree.json`, `dom/tree.html`, `dom/elements/*` | CDP `DOM.getDocument` |
| `CSSResourceProvider` | `css/stylesheets/*`, `css/cascade/*`, `css/issues.json` | CDP `CSS.getMatchedStylesForNode` |
| `ComponentResourceProvider` | `components/tree.json`, `components/*` | Framework detector + CDP |
| `NetworkResourceProvider` | `network/requests.json`, `network/failures.json` | CDP `Network.requestWillBeSent` |
| `PerformanceResourceProvider` | `performance/metrics.json` | CDP `Performance.getMetrics` |

### 2.3 MCP Tools

**Interface**: `IToolProvider`

**Implementations**:

| Tool | Purpose | Parameters |
|------|---------|------------|
| `query-dom` | Query DOM by CSS selector | `{ selector: string }` |
| `trace-css-cascade` | Trace CSS cascade for property | `{ selector: string, property: string }` |
| `get-component-state` | Get framework component state | `{ componentName: string }` |
| `evaluate-expression` | Evaluate JavaScript in page | `{ expression: string }` |
| `get-network-waterfall` | Get network timing waterfall | `{ filter?: string }` |

### 2.4 MCP Prompts

**Interface**: `IPromptProvider`

**Examples**:

| Prompt | Context |
|--------|---------|
| `debug-console-error` | Console errors + stack traces + source maps |
| `analyze-dom-structure` | Full DOM tree + CSS + framework components |
| `trace-css-issue` | CSS cascade + specificity + source locations |
| `inspect-component` | Component state + props + event handlers |
| `analyze-performance` | Performance metrics + bottlenecks |

---

## 3. Framework Detection Design

### 3.1 Universal Framework Detector

**Interface**: `IFrameworkDetector`

**Detection Strategy**: Priority-based chain

```typescript
class UniversalFrameworkDetector {
  async detect(tabId: number, nodeId: number): Promise<FrameworkData | null> {
    // Check in priority order
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
      this.detectAstro,
      this.detectWebComponent,
    ];

    for (const detect of detectors) {
      const framework = await detect(tabId, nodeId);
      if (framework) return framework;
    }

    return null;
  }
}
```

### 3.2 Framework-Specific Detection

**React Detection** (Fiber):
```typescript
await cdpAdapter.send(tabId, 'Runtime.evaluate', {
  expression: `
    const fiberKey = Object.keys(node).find(k => k.startsWith('__reactFiber'));
    fiberKey ? { name: 'React', version: React.version } : null;
  `
});
```

**Vue Detection** (Vue 3):
```typescript
await cdpAdapter.send(tabId, 'Runtime.evaluate', {
  expression: `
    node.__vnode ? { name: 'Vue', version: Vue.version } : null;
  `
});
```

**Blazor Detection**:
```typescript
await cdpAdapter.send(tabId, 'Runtime.evaluate', {
  expression: `
    node.hasAttribute('_bl_') ? {
      name: 'Blazor',
      mode: window.Blazor._internal.renderMode
    } : null;
  `
});
```

**Alpine.js Detection**:
```typescript
await cdpAdapter.send(tabId, 'Runtime.evaluate', {
  expression: `
    node.hasAttribute('x-data') ? { name: 'Alpine' } : null;
  `
});
```

**htmx Detection**:
```typescript
await cdpAdapter.send(tabId, 'Runtime.evaluate', {
  expression: `
    node.hasAttribute('hx-get') || node.hasAttribute('hx-post') ? { name: 'htmx' } : null;
  `
});
```

### 3.3 Component Data Extraction

**React Component Data**:
```typescript
{
  name: 'Button',
  props: { text: 'Click me', disabled: false },
  state: { count: 0 },
  hooks: ['useState', 'useEffect'],
  sourceLocation: { file: 'src/Button.tsx', line: 10 }
}
```

**Vue Component Data**:
```typescript
{
  name: 'MyButton',
  props: { label: 'Submit' },
  data: { isLoading: false },
  computed: ['buttonClass'],
  sourceLocation: { file: 'src/MyButton.vue', line: 25 }
}
```

**Blazor Component Data**:
```typescript
{
  name: 'SubmitButton',
  parameters: { Text: 'Submit', Disabled: false },
  mode: 'wasm',
  assembly: 'MyApp.Client',
  sourceLocation: { file: 'Pages/SubmitButton.razor', line: 5 }
}
```

---

## 4. Protocol Adapters Design

### 4.1 Adapter Architecture

**Base Interface**: `IBrowserProtocolAdapter`

**Implementations**:
- `CDPAdapter` - Chrome DevTools Protocol (Chrome, Edge)
- `RDPAdapter` - Remote Debugging Protocol (Firefox)
- `WebKitAdapter` - WebKit Inspector (Safari)

### 4.2 CDP Adapter (Chrome)

**Connection**:
```typescript
class CDPAdapter implements ICDPAdapter {
  async connect(tabId: number): Promise<void> {
    // Use chrome.debugger API
    await chrome.debugger.attach({ tabId }, '1.3'); // CDP version 1.3

    // Enable domains
    await this.enableDomain(tabId, 'Console');
    await this.enableDomain(tabId, 'DOM');
    await this.enableDomain(tabId, 'CSS');
    await this.enableDomain(tabId, 'Network');
    await this.enableDomain(tabId, 'Runtime');
  }

  async send<T>(tabId: number, method: string, params?: object): Promise<T> {
    return new Promise((resolve, reject) => {
      chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve(result as T);
        }
      });
    });
  }
}
```

**Key CDP Methods Used**:

| Domain | Method | Purpose |
|--------|--------|---------|
| `DOM` | `DOM.getDocument` | Get full DOM tree |
| `DOM` | `DOM.querySelector` | Query by selector |
| `CSS` | `CSS.getMatchedStylesForNode` | Get cascade |
| `Console` | `Console.enable` | Enable console events |
| `Network` | `Network.enable` | Track network requests |
| `Runtime` | `Runtime.evaluate` | Execute JavaScript |

### 4.3 RDP Adapter (Firefox)

**Connection**:
```typescript
class RDPAdapter implements IRDPAdapter {
  async connect(tabId: number): Promise<void> {
    // Use browser.debugger API (WebExtensions)
    await browser.debugger.attach({ tabId }, '1.0');

    // Get actor ID
    this.actorId = await this.getActorId(tabId);

    // Attach to tab actor
    await this.attachToTab(tabId);
  }

  async send<T>(tabId: number, method: string, params?: object): Promise<T> {
    // RDP uses "to" field with actor ID
    return browser.debugger.sendCommand({ tabId }, {
      to: this.actorId,
      type: method,
      ...params,
    }) as Promise<T>;
  }
}
```

### 4.4 WebKit Adapter (Safari)

**Connection**:
```typescript
class WebKitAdapter implements IWebKitAdapter {
  async connect(tabId: number): Promise<void> {
    // Safari uses WebKit remote inspector protocol
    await safari.extension.debugger.attach(tabId);

    // Enable domains
    await this.send(tabId, 'Console.enable');
    await this.send(tabId, 'DOM.enable');
    await this.send(tabId, 'CSS.enable');
  }

  async send<T>(tabId: number, method: string, params?: object): Promise<T> {
    return safari.extension.debugger.sendCommand(tabId, method, params) as Promise<T>;
  }
}
```

---

## 5. Business Logic Design

### 5.1 DOM Extraction

**Interface**: `IDOMExtractor`

**Key Methods**:

| Method | CDP Command | Performance |
|--------|-------------|-------------|
| `getDOMTree()` | `DOM.getDocument` | <100ms |
| `getDOMNode(nodeId)` | `DOM.describeNode` | <20ms |
| `queryDOM(selector)` | `DOM.querySelectorAll` | <50ms |
| `getDOMHTML()` | `DOM.getOuterHTML` | <80ms |

**Optimization**: Cache DOM tree with invalidation on mutation events.

### 5.2 CSS Extraction

**Interface**: `ICSSExtractor`

**Cascade Tracing**:
```typescript
async traceCascade(tabId: number, nodeId: number, property: string): Promise<CSSCascade> {
  // Get matched styles
  const styles = await cdpAdapter.send(tabId, 'CSS.getMatchedStylesForNode', { nodeId });

  // Filter rules that set the property
  const matchingRules = styles.matchedCSSRules
    .filter(rule => rule.style.cssProperties.some(p => p.name === property))
    .map(rule => ({
      selector: rule.selectorList.selectors.map(s => s.text).join(', '),
      value: rule.style.cssProperties.find(p => p.name === property).value,
      specificity: rule.selectorList.selectors[0].specificity,
      sourceLocation: rule.style.range ? this.mapCSSLocation(rule.style.range) : null,
    }));

  // Sort by specificity
  matchingRules.sort((a, b) => b.specificity - a.specificity);

  return {
    property,
    computedValue: styles.inlineStyle?.cssProperties.find(p => p.name === property)?.value,
    matchingRules,
  };
}
```

### 5.3 Console Extraction

**Interface**: `IConsoleExtractor`

**Real-time Console Subscription**:
```typescript
subscribeToConsole(tabId: number, callback: (message: ConsoleMessage) => void): () => void {
  // Subscribe to CDP Console.messageAdded event
  const handler = (params: any) => {
    const message: ConsoleMessage = {
      level: params.level,
      text: params.text,
      args: params.args,
      stackTrace: params.stackTrace,
      timestamp: params.timestamp,
      source: params.url,
    };
    callback(message);
  };

  cdpAdapter.on(tabId, 'Console.messageAdded', handler);

  // Return unsubscribe function
  return () => cdpAdapter.off(tabId, 'Console.messageAdded', handler);
}
```

### 5.4 Source Mapping

**Interface**: `ISourceMapper`

**Source Map Loading**:
```typescript
async loadSourceMaps(tabId: number): Promise<void> {
  // Get all scripts
  const scripts = await cdpAdapter.send(tabId, 'Debugger.getScriptSource', {});

  for (const script of scripts) {
    if (script.sourceMapURL) {
      // Fetch source map
      const sourceMapContent = await fetch(script.sourceMapURL).then(r => r.text());

      // Parse source map (Mozilla's source-map library)
      const consumer = await new SourceMapConsumer(sourceMapContent);

      // Cache source map
      this.sourceMapCache.set(script.url, consumer);

      // Emit event
      eventBus.emit('SourceMapLoaded', { tabId, url: script.url });
    }
  }
}
```

**Runtime → Source Mapping**:
```typescript
async mapToSource(tabId: number, runtimeFile: string, line: number, column: number): Promise<SourceLocation | null> {
  const consumer = this.sourceMapCache.get(runtimeFile);
  if (!consumer) return null;

  const original = consumer.originalPositionFor({ line, column });
  if (!original.source) return null;

  return {
    file: original.source,
    line: original.line,
    column: original.column,
  };
}
```

---

## 6. Performance Design

### 6.1 Multi-Tier Caching Strategy

**Cache Levels**:

| Level | Storage | Eviction | Access Time | Use Case |
|-------|---------|----------|-------------|----------|
| **L1** | In-memory Map | LRU (100 items) | <5ms | Hot data (current DOM tree) |
| **L2** | Redis (optional) | TTL (5 min) | <20ms | Warm data (source maps) |
| **L3** | Browser storage | Manual | <50ms | Cold data (historical logs) |

**Cache Keys**:
```typescript
// DOM tree cache
`dom:${tabId}:tree` → DOMTree

// CSS cascade cache
`css:${tabId}:${nodeId}:${property}` → CSSCascade

// Framework detection cache
`framework:${tabId}` → FrameworkData

// Source map cache
`sourcemap:${url}` → SourceMapConsumer
```

**Cache Invalidation**:
```typescript
// Invalidate DOM cache on mutation
cdpAdapter.on(tabId, 'DOM.documentUpdated', () => {
  cacheManager.invalidate(`dom:${tabId}:tree`);
  eventBus.emit('DOMUpdated', { tabId, nodeCount });
});

// Invalidate CSS cache on style change
cdpAdapter.on(tabId, 'CSS.styleSheetChanged', () => {
  cacheManager.invalidatePattern(`css:${tabId}:*`);
});
```

### 6.2 Query Optimization

**Batch Queries**:
```typescript
// Instead of: N queries for N nodes
for (const nodeId of nodeIds) {
  await getDOMNode(tabId, nodeId); // N * 20ms = slow
}

// Use batch query:
await batchGetDOMNodes(tabId, nodeIds); // Single CDP call = 50ms
```

**Selective DOM Loading**:
```typescript
// Don't load full DOM tree - use incremental loading
async getDOMTree(tabId: number, maxDepth: number = 5): Promise<DOMTree> {
  return cdpAdapter.send(tabId, 'DOM.getDocument', { depth: maxDepth });
}
```

### 6.3 Performance Monitoring

**Query Performance Tracking**:
```typescript
async getDOMTree(tabId: number): Promise<DOMTree> {
  const start = performance.now();

  const tree = await cdpAdapter.send(tabId, 'DOM.getDocument');

  const elapsed = performance.now() - start;

  // Log slow queries
  if (elapsed > 100) {
    console.warn(`Slow DOM query: ${elapsed}ms`);
  }

  return tree;
}
```

---

## 7. Port Management Design

### 7.1 Smart Port Allocation

**Interface**: `IPortManager`

**Algorithm**:
```typescript
class PortManager implements IPortManager {
  private readonly DEFAULT_RANGE = [3100, 3199]; // 100 ports
  private readonly FALLBACK_RANGE = [3200, 3299]; // 100 more ports
  private reservedPorts = new Map<number, number>(); // tabId → port

  async findAvailablePort(): Promise<number> {
    // Try default range first
    for (let port = this.DEFAULT_RANGE[0]; port <= this.DEFAULT_RANGE[1]; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }

    // Fallback to higher range
    for (let port = this.FALLBACK_RANGE[0]; port <= this.FALLBACK_RANGE[1]; port++) {
      if (await this.isPortAvailable(port)) {
        return port;
      }
    }

    throw new Error('No available ports in range 3100-3299');
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
}
```

### 7.2 Multi-Tab Port Allocation

**Example**:
```
Tab 1 (localhost:3000) → Port 3142
Tab 2 (localhost:8080) → Port 3143
Tab 3 (staging.app.com) → Port 3144
```

**Virtual Filesystem URIs**:
```
browser://tab-localhost-3000@mcp-3142/
browser://tab-localhost-8080@mcp-3143/
browser://tab-staging-app-com@mcp-3144/
```

---

## 8. Implementation Phases

### Phase 1: Foundation + Browser Extension Shell (Weeks 1-2)

**Deliverables**:
- [ ] `contracts/` package (v1.0.0) - All interfaces
- [ ] Browser extension manifest (Chrome, Firefox, Safari)
- [ ] Service worker with embedded MCP server skeleton
- [ ] Content script injection
- [ ] Popup UI (activation interface)
- [ ] Port manager implementation
- [ ] Test infrastructure setup (Puppeteer, Playwright, Docker)

**Key Interfaces**:
- `IMCPServer`, `ITabManager`, `IPortManager`
- `IEventBus`

**Tests**:
- Extension installs correctly
- Popup activates tab
- Port allocation works (3100-3199 range)
- Content script injects successfully

### Phase 2: Protocol Adapters (Weeks 3-4)

**Deliverables**:
- [ ] CDP adapter (Chrome/Edge)
- [ ] RDP adapter (Firefox)
- [ ] WebKit adapter (Safari)
- [ ] Protocol adapter tests (real browsers)

**Key Interfaces**:
- `IBrowserProtocolAdapter`, `ICDPAdapter`, `IRDPAdapter`, `IWebKitAdapter`

**Tests**:
- Connect to Chrome via CDP
- Connect to Firefox via RDP
- Connect to Safari via WebKit
- Send commands and receive responses

### Phase 3: Business Logic - Data Extraction (Weeks 5-7)

**Deliverables**:
- [ ] DOM extractor (tree, query, HTML)
- [ ] CSS extractor (cascade tracing)
- [ ] Console extractor (messages, errors)
- [ ] Network extractor (requests, timing)
- [ ] Performance extractor (metrics)
- [ ] Source mapper (runtime ↔ source)

**Key Interfaces**:
- `IDOMExtractor`, `ICSSExtractor`, `IConsoleExtractor`, `ISourceMapper`

**Tests**:
- Extract full DOM tree in <100ms
- Trace CSS cascade correctly
- Map console errors to source files
- Load and parse source maps

### Phase 4: Framework Detection (Weeks 8-10)

**Deliverables**:
- [ ] Universal framework detector
- [ ] 17+ framework-specific detectors
- [ ] Component data extractors per framework
- [ ] Test apps for each framework

**Key Interfaces**:
- `IFrameworkDetector`, `IComponentInspector`

**Tests**:
- Detect React (Fiber)
- Detect Vue (2.x, 3.x)
- Detect Blazor (WASM, Server)
- Detect Svelte, Angular, Solid, Lit, Alpine, htmx, etc.
- Extract component state, props, source locations

### Phase 5: MCP Server - Resources & Tools (Weeks 11-13)

**Deliverables**:
- [ ] Resource providers (console, DOM, CSS, components, network, performance)
- [ ] Tool providers (query-dom, trace-css, get-component-state, etc.)
- [ ] Prompt providers (debugging prompts)
- [ ] Virtual filesystem routing

**Key Interfaces**:
- `IResourceProvider`, `IToolProvider`, `IPromptProvider`

**Tests**:
- AI reads `browser://tab-*/console/errors`
- AI uses `query-dom` tool
- AI uses `trace-css-cascade` tool
- AI gets debugging context prompts

### Phase 6: Performance & Caching (Weeks 14-15)

**Deliverables**:
- [ ] L1 cache (in-memory)
- [ ] L2 cache (Redis - optional)
- [ ] Cache invalidation (DOM mutations, style changes)
- [ ] Query batching
- [ ] Performance monitoring

**Tests**:
- DOM queries <100ms
- CSS queries <50ms (cached)
- Cache invalidates correctly
- Performance tracking logs slow queries

### Phase 7: End-to-End Testing & Deployment (Weeks 16-18)

**Deliverables**:
- [ ] E2E tests with real AI assistant
- [ ] Chrome Web Store submission
- [ ] Firefox Add-ons submission
- [ ] Safari Extensions submission
- [ ] Documentation (user guides, API docs)
- [ ] CI/CD pipeline

**Tests**:
- Full extension flow (install → activate → query → debug)
- AI successfully debugs React app
- AI successfully debugs Vue app
- AI successfully debugs Blazor app
- Cross-browser compatibility (Chrome, Firefox, Safari)

---

## 9. Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| **Browser Support** | Chrome, Firefox, Safari | Extension works in all 3 browsers |
| **Framework Support** | 17+ frameworks | Detects all major frameworks |
| **Query Performance** | <100ms (most queries) | Performance tests pass |
| **Source Mapping** | 100% accuracy | All console errors map to source |
| **Zero-Config** | 1-click activation | User installs + clicks "Activate" |
| **Test Coverage** | >80% with real browsers | No mocks used |
| **ISP Compliance** | 100% | All logic behind interfaces |
| **TDD Compliance** | 100% | All features test-first |

---

## 10. Architecture Decision Records (ADRs)

**Key Decisions**:

1. **ADR-001**: Browser extension (not standalone CLI) - Zero-config UX
2. **ADR-002**: Embedded MCP server (not separate process) - Simplicity
3. **ADR-003**: Real browser testing (no mocks) - Production confidence
4. **ADR-004**: EventEmitter3 (not complex event sourcing) - KISS principle
5. **ADR-005**: ISP with semantic versioning - Interface immutability
6. **ADR-006**: Multi-tier caching - Sub-100ms performance
7. **ADR-007**: Data provider only (no embedded AI) - Clear separation
8. **ADR-008**: Universal framework detector - 17+ frameworks
9. **ADR-009**: Smart port allocation - Multi-tab support
10. **ADR-010**: Source mapping integration - Complete debugging context

---

## 11. Next Steps for Implementation

**For Engineer Role**:

1. **Set up monorepo** (`contracts/`, `core/`, `infrastructure/`, `mcp-server/`, `extension-chromium/`)
2. **Create `contracts/` package v1.0.0** (all interfaces from INTERFACES.md)
3. **Set up test infrastructure** (Puppeteer, Playwright, Docker, test apps)
4. **Follow TDD workflow** (interface → test → implement)
5. **Start with Phase 1** (extension shell + port manager)
6. **Iterate through phases** (protocol adapters → business logic → framework detection → MCP server → performance)

**Review These Documents First**:
1. [DESIGN.md](DESIGN.md) - Master architecture
2. [design/contracts/INTERFACES.md](design/contracts/INTERFACES.md) - All interfaces
3. [design/testing/TDD-STRATEGY.md](design/testing/TDD-STRATEGY.md) - TDD workflow

**Key Resources**:
- `.cursorrules` - Architectural mandates (ISP, TDD, Event-Driven)
- `REQUIREMENTS.md` - Complete functional requirements
- Chrome DevTools Protocol: https://chromedevtools.github.io/devtools-protocol/
- Firefox Remote Debugging: https://firefox-source-docs.mozilla.org/devtools/backend/protocol.html
- WebKit Inspector Protocol: https://webkit.org/web-inspector/enabling-web-inspector/

---

**END OF DESIGN DOCUMENT SUMMARY**

All designs enforce ISP (Interface Segregation Principle) and TDD (Test-Driven Development with real browsers, no mocks) as mandated by `.cursorrules`.

Implementation can begin immediately with Phase 1: Foundation + Browser Extension Shell.
