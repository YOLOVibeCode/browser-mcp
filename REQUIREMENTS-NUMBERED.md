# Browser MCP Family - Numbered Requirements Breakdown

**Version**: 1.0
**Date**: 2025-01-05
**Status**: Architecture Phase
**Source**: REQUIREMENTS.md

---

## Requirements Organization

This document breaks down ALL requirements from REQUIREMENTS.md into numbered, testable requirements organized by functional category.

---

## 1. Core System Requirements

### 1.1 Purpose & Scope

**REQ-1.1.1**: System SHALL expose browser internals (Console, DOM, CSS, Network, Performance, Runtime) as structured, queryable data via MCP protocol.

**REQ-1.1.2**: System SHALL provide same level of fidelity for browser state as file system MCP servers provide for codebases.

**REQ-1.1.3**: System SHALL act as data provider ONLY - NO embedded AI, NO pattern detection, NO fix generation.

### 1.2 Three-Way Context Integration

**REQ-1.2.1**: System SHALL bridge live browser state ↔ source code files ↔ source mappings.

**REQ-1.2.2**: System SHALL enable tracing from DOM element → source file → line number.

**REQ-1.2.3**: System SHALL enable tracing from source file → runtime DOM element.

**REQ-1.2.4**: System SHALL maintain bidirectional mapping throughout debugging session.

### 1.3 Primary Use Case

**REQ-1.3.1**: System SHALL attach to existing browser session (not launch new browser).

**REQ-1.3.2**: System SHALL provide real-time structured data extraction from running application.

**REQ-1.3.3**: System SHALL eliminate need for copy/paste of console logs, DOM structure, or CSS styles.

---

## 2. Browser Extension Requirements

### 2.1 Extension Architecture

**REQ-2.1.1**: System SHALL be deployed as browser extension (Chrome/Firefox/Safari).

**REQ-2.1.2**: Extension SHALL use Manifest v3 (Chrome/Edge).

**REQ-2.1.3**: Extension SHALL use WebExtensions API (Firefox).

**REQ-2.1.4**: Extension SHALL use Safari Extensions API (Safari).

**REQ-2.1.5**: Extension SHALL embed MCP server in background service worker.

**REQ-2.1.6**: Extension SHALL inject content scripts per activated tab.

**REQ-2.1.7**: Extension SHALL provide popup UI for tab activation.

### 2.2 Zero-Config User Experience

**REQ-2.2.1**: User SHALL install extension from browser store (Chrome Web Store, Firefox Add-ons, Safari Extensions).

**REQ-2.2.2**: User SHALL click extension icon on target tab to activate debugging.

**REQ-2.2.3**: Extension SHALL activate debugging with single click (no configuration required).

**REQ-2.2.4**: Extension SHALL automatically detect framework in target tab.

**REQ-2.2.5**: Extension SHALL mount virtual filesystem for tab automatically.

**REQ-2.2.6**: AI assistant SHALL automatically discover mounted tab filesystem.

### 2.3 Popup UI

**REQ-2.3.1**: Popup SHALL display current tab URL and title.

**REQ-2.3.2**: Popup SHALL display detected framework (if any).

**REQ-2.3.3**: Popup SHALL display "Activate" button for inactive tabs.

**REQ-2.3.4**: Popup SHALL display "Deactivate" button for active tabs.

**REQ-2.3.5**: Popup SHALL display MCP server port selection (auto or manual).

**REQ-2.3.6**: Popup SHALL display success notification after activation with:
- Selected port number
- Tab URL
- Detected framework
- Connection instructions for AI

**REQ-2.3.7**: Popup SHALL provide "Copy Port" button for easy AI configuration.

**REQ-2.3.8**: Popup SHALL provide "Copy Config" button for AI assistant configuration.

### 2.4 Service Worker

**REQ-2.4.1**: Service worker SHALL host embedded MCP server instance.

**REQ-2.4.2**: Service worker SHALL manage tab lifecycle (activate/deactivate).

**REQ-2.4.3**: Service worker SHALL allocate ports via IPortManager.

**REQ-2.4.4**: Service worker SHALL route MCP requests to appropriate content script.

**REQ-2.4.5**: Service worker SHALL use EventEmitter3 for cross-component communication.

**REQ-2.4.6**: Service worker SHALL persist active tab state across browser restarts.

### 2.5 Content Script

**REQ-2.5.1**: Content script SHALL be injected into activated tabs only.

**REQ-2.5.2**: Content script SHALL connect to browser debugging API (chrome.debugger / browser.debugger).

**REQ-2.5.3**: Content script SHALL detect framework on injection.

**REQ-2.5.4**: Content script SHALL extract DOM, CSS, Console, Network, Performance data.

**REQ-2.5.5**: Content script SHALL forward extracted data to service worker.

**REQ-2.5.6**: Content script SHALL subscribe to real-time browser events (DOM mutations, console messages, etc.).

---

## 3. Port Management Requirements

### 3.1 Smart Port Allocation

**REQ-3.1.1**: System SHALL scan for available ports in default range (3100-3199).

**REQ-3.1.2**: System SHALL fallback to secondary range (3200-3299) if default range exhausted.

**REQ-3.1.3**: System SHALL throw NoAvailablePortError if all ports (3100-3299) are occupied.

**REQ-3.1.4**: System SHALL verify port availability by attempting bind/close test.

**REQ-3.1.5**: System SHALL reserve port for tab after successful allocation.

**REQ-3.1.6**: System SHALL release port when tab is deactivated.

**REQ-3.1.7**: System SHALL emit PortAllocated event when port is reserved.

### 3.2 Multi-Tab Support

**REQ-3.2.1**: System SHALL support multiple active tabs simultaneously.

**REQ-3.2.2**: Each active tab SHALL have unique MCP server port.

**REQ-3.2.3**: System SHALL maintain map of tabId → port.

**REQ-3.2.4**: System SHALL maintain reverse map of port → tabId.

**REQ-3.2.5**: AI assistant SHALL be able to query multiple tabs concurrently.

### 3.3 Port Configuration

**REQ-3.3.1**: User SHALL be able to configure default port range in extension settings.

**REQ-3.3.2**: User SHALL be able to manually specify port (override auto-selection).

**REQ-3.3.3**: System SHALL validate manually specified port availability before use.

**REQ-3.3.4**: System SHALL display current port allocation in extension popup.

---

## 4. MCP Server Requirements

### 4.1 MCP Protocol Compliance

**REQ-4.1.1**: MCP server SHALL implement Model Context Protocol specification.

**REQ-4.1.2**: MCP server SHALL use @modelcontextprotocol/sdk library.

**REQ-4.1.3**: MCP server SHALL expose Resources, Tools, and Prompts.

**REQ-4.1.4**: MCP server SHALL communicate via Native Messaging or WebSocket.

**REQ-4.1.5**: MCP server SHALL handle concurrent requests from AI assistant.

### 4.2 Virtual Filesystem

**REQ-4.2.1**: System SHALL expose tab state as virtual filesystem with URI pattern: `browser://tab-{identifier}/`

**REQ-4.2.2**: Virtual filesystem SHALL include following top-level directories:
- `console/`
- `dom/`
- `css/`
- `network/`
- `performance/`
- `components/`
- `sources/`

**REQ-4.2.3**: Virtual filesystem SHALL support hierarchical resource paths (e.g., `browser://tab-localhost-3000/console/errors`).

**REQ-4.2.4**: Virtual filesystem SHALL return resources as text, JSON, or HTML based on resource type.

**REQ-4.2.5**: Virtual filesystem SHALL support query parameters for filtering (e.g., `?level=error`).

### 4.3 MCP Resources

**REQ-4.3.1**: System SHALL provide `console/messages` resource with all console messages.

**REQ-4.3.2**: System SHALL provide `console/errors` resource with only error-level messages.

**REQ-4.3.3**: System SHALL provide `console/warnings` resource with only warning-level messages.

**REQ-4.3.4**: System SHALL provide `dom/tree.json` resource with full DOM tree as JSON.

**REQ-4.3.5**: System SHALL provide `dom/tree.html` resource with full DOM tree as HTML.

**REQ-4.3.6**: System SHALL provide `dom/elements/{selector}/` resources for CSS selector query results.

**REQ-4.3.7**: System SHALL provide `css/stylesheets/` resources for all loaded stylesheets.

**REQ-4.3.8**: System SHALL provide `css/cascade/{selector}/{property}` resource for CSS cascade trace.

**REQ-4.3.9**: System SHALL provide `css/issues.json` resource with detected CSS issues.

**REQ-4.3.10**: System SHALL provide `network/requests.json` resource with all network requests.

**REQ-4.3.11**: System SHALL provide `network/failures.json` resource with failed requests only.

**REQ-4.3.12**: System SHALL provide `performance/metrics.json` resource with performance metrics.

**REQ-4.3.13**: System SHALL provide `components/tree.json` resource with framework component tree.

**REQ-4.3.14**: System SHALL provide `components/{componentName}/` resources for component state, props, source.

**REQ-4.3.15**: System SHALL provide `sources/map.json` resource with source map index.

### 4.4 MCP Tools

**REQ-4.4.1**: System SHALL provide `query-dom` tool with parameter `{ selector: string }`.

**REQ-4.4.2**: System SHALL provide `trace-css-cascade` tool with parameters `{ selector: string, property: string }`.

**REQ-4.4.3**: System SHALL provide `get-component-state` tool with parameter `{ componentName: string }`.

**REQ-4.4.4**: System SHALL provide `evaluate-expression` tool with parameter `{ expression: string }`.

**REQ-4.4.5**: System SHALL provide `get-network-waterfall` tool with optional parameter `{ filter?: string }`.

**REQ-4.4.6**: All tools SHALL return success/error status and data/error message.

**REQ-4.4.7**: All tools SHALL validate input parameters against JSON schema.

### 4.5 MCP Prompts

**REQ-4.5.1**: System SHALL provide `debug-console-error` prompt with console errors + stack traces + source maps.

**REQ-4.5.2**: System SHALL provide `analyze-dom-structure` prompt with full DOM tree + CSS + components.

**REQ-4.5.3**: System SHALL provide `trace-css-issue` prompt with CSS cascade + specificity + source locations.

**REQ-4.5.4**: System SHALL provide `inspect-component` prompt with component state + props + event handlers.

**REQ-4.5.5**: System SHALL provide `analyze-performance` prompt with performance metrics + bottlenecks.

---

## 5. Browser Protocol Requirements

### 5.1 Chrome DevTools Protocol (CDP)

**REQ-5.1.1**: System SHALL support Chrome DevTools Protocol for Chrome and Edge browsers.

**REQ-5.1.2**: System SHALL use chrome.debugger API for CDP connection.

**REQ-5.1.3**: System SHALL attach to tab with CDP version 1.3+.

**REQ-5.1.4**: System SHALL enable CDP domains: Console, DOM, CSS, Network, Runtime, Performance.

**REQ-5.1.5**: System SHALL subscribe to CDP events: Console.messageAdded, DOM.documentUpdated, CSS.styleSheetChanged, Network.requestWillBeSent.

**REQ-5.1.6**: System SHALL send CDP commands: DOM.getDocument, DOM.querySelectorAll, CSS.getMatchedStylesForNode, Runtime.evaluate.

**REQ-5.1.7**: System SHALL handle CDP disconnection and reconnection gracefully.

### 5.2 Firefox Remote Debugging Protocol (RDP)

**REQ-5.2.1**: System SHALL support Firefox Remote Debugging Protocol for Firefox browser.

**REQ-5.2.2**: System SHALL use browser.debugger API for RDP connection.

**REQ-5.2.3**: System SHALL obtain actor ID for tab.

**REQ-5.2.4**: System SHALL attach to tab actor.

**REQ-5.2.5**: System SHALL send RDP commands with "to" field containing actor ID.

**REQ-5.2.6**: System SHALL handle RDP actor model correctly.

### 5.3 WebKit Inspector Protocol

**REQ-5.3.1**: System SHALL support WebKit Inspector Protocol for Safari browser.

**REQ-5.3.2**: System SHALL use safari.extension.debugger API for connection.

**REQ-5.3.3**: System SHALL enable WebKit domains: Console, DOM, CSS.

**REQ-5.3.4**: System SHALL handle WebKit-specific protocol quirks.

---

## 6. Framework Detection Requirements

### 6.1 Universal Framework Support

**REQ-6.1.1**: System SHALL detect React framework (versions 16+, Fiber architecture).

**REQ-6.1.2**: System SHALL detect Vue framework (versions 2.x and 3.x).

**REQ-6.1.3**: System SHALL detect Angular framework (versions 12+, Ivy renderer).

**REQ-6.1.4**: System SHALL detect Svelte framework.

**REQ-6.1.5**: System SHALL detect Solid.js framework.

**REQ-6.1.6**: System SHALL detect Blazor framework (WebAssembly and Server modes).

**REQ-6.1.7**: System SHALL detect Preact framework.

**REQ-6.1.8**: System SHALL detect Qwik framework.

**REQ-6.1.9**: System SHALL detect Astro framework.

**REQ-6.1.10**: System SHALL detect Lit web components.

**REQ-6.1.11**: System SHALL detect Stencil web components.

**REQ-6.1.12**: System SHALL detect generic custom elements (Web Components).

**REQ-6.1.13**: System SHALL detect Ember.js framework.

**REQ-6.1.14**: System SHALL detect Backbone.js framework.

**REQ-6.1.15**: System SHALL detect Aurelia framework.

**REQ-6.1.16**: System SHALL detect Alpine.js library.

**REQ-6.1.17**: System SHALL detect htmx library (attribute-based).

**REQ-6.1.18**: System SHALL detect multiple frameworks in same page (if present).

**REQ-6.1.19**: System SHALL emit FrameworkDetected event when framework is detected.

### 6.2 Framework-Specific Detection Methods

**REQ-6.2.1**: React detection SHALL check for `__reactFiber` property on DOM nodes.

**REQ-6.2.2**: Vue detection SHALL check for `__vnode` or `__vue__` property on DOM nodes.

**REQ-6.2.3**: Angular detection SHALL check for `ng` property on DOM nodes.

**REQ-6.2.4**: Blazor detection SHALL check for `_bl_` attribute on DOM nodes.

**REQ-6.2.5**: Alpine.js detection SHALL check for `x-data` attribute on DOM nodes.

**REQ-6.2.6**: htmx detection SHALL check for `hx-get`, `hx-post`, or other htmx attributes.

**REQ-6.2.7**: Web Components detection SHALL check for custom element tag names (containing hyphen).

**REQ-6.2.8**: Framework detection SHALL use runtime inspection via Runtime.evaluate (CDP).

### 6.3 Component Data Extraction

**REQ-6.3.1**: System SHALL extract React component name, props, state, hooks, source location.

**REQ-6.3.2**: System SHALL extract Vue component name, props, data, computed properties, source location.

**REQ-6.3.3**: System SHALL extract Angular component name, inputs, outputs, source location.

**REQ-6.3.4**: System SHALL extract Svelte component name, props, source location.

**REQ-6.3.5**: System SHALL extract Blazor component name, parameters, render mode, assembly, source location.

**REQ-6.3.6**: System SHALL extract Solid.js component name, signals, source location.

**REQ-6.3.7**: System SHALL extract Lit element name, properties, source location.

**REQ-6.3.8**: System SHALL extract Alpine.js component data from `x-data` attribute.

**REQ-6.3.9**: System SHALL map component data to source file and line number.

---

## 7. DOM Extraction Requirements

### 7.1 DOM Tree Extraction

**REQ-7.1.1**: System SHALL extract full DOM tree using CDP DOM.getDocument.

**REQ-7.1.2**: System SHALL provide DOM tree in JSON format (structured).

**REQ-7.1.3**: System SHALL provide DOM tree in HTML format (serialized).

**REQ-7.1.4**: System SHALL include node ID, node type, node name, node value, attributes for each node.

**REQ-7.1.5**: System SHALL include children array for each element node.

**REQ-7.1.6**: System SHALL include total node count in DOM tree.

**REQ-7.1.7**: System SHALL support incremental DOM loading with max depth parameter.

### 7.2 DOM Query

**REQ-7.2.1**: System SHALL support CSS selector queries via CDP DOM.querySelectorAll.

**REQ-7.2.2**: System SHALL return array of matching DOM nodes for query.

**REQ-7.2.3**: System SHALL support complex CSS selectors (class, ID, attribute, pseudo-class).

**REQ-7.2.4**: System SHALL map query results to source locations via source maps.

### 7.3 DOM Node Inspection

**REQ-7.3.1**: System SHALL provide detailed node data for specific node ID.

**REQ-7.3.2**: System SHALL include computed styles for element nodes.

**REQ-7.3.3**: System SHALL include event listeners for nodes (if available via protocol).

**REQ-7.3.4**: System SHALL include framework component data if node is component root.

### 7.4 DOM Performance

**REQ-7.4.1**: getDOMTree() SHALL complete in <100ms for typical page (< 5000 nodes).

**REQ-7.4.2**: getDOMNode() SHALL complete in <20ms.

**REQ-7.4.3**: queryDOM() SHALL complete in <50ms for typical selector.

**REQ-7.4.4**: getDOMHTML() SHALL complete in <80ms.

---

## 8. CSS Extraction Requirements

### 8.1 Stylesheet Extraction

**REQ-8.1.1**: System SHALL extract all stylesheets loaded in page.

**REQ-8.1.2**: System SHALL include stylesheet URL, rules, source location for each stylesheet.

**REQ-8.1.3**: System SHALL support inline styles (<style> tags).

**REQ-8.1.4**: System SHALL support external stylesheets (<link> tags).

**REQ-8.1.5**: System SHALL support computed styles from JavaScript.

### 8.2 CSS Cascade Tracing

**REQ-8.2.1**: System SHALL trace CSS cascade for specific DOM node and property.

**REQ-8.2.2**: System SHALL return all matching CSS rules in cascade order.

**REQ-8.2.3**: System SHALL include selector, value, specificity, source location for each rule.

**REQ-8.2.4**: System SHALL compute final value (winning rule in cascade).

**REQ-8.2.5**: System SHALL map CSS rules to source files via source maps (SCSS, LESS, etc.).

### 8.3 CSS Issue Detection

**REQ-8.3.1**: System SHALL detect unused CSS rules (rules that match no elements).

**REQ-8.3.2**: System SHALL detect specificity conflicts (multiple rules with same specificity).

**REQ-8.3.3**: System SHALL detect invalid CSS properties.

**REQ-8.3.4**: System SHALL provide issue type, message, and rule reference for each issue.

### 8.4 CSS Performance

**REQ-8.4.1**: getStylesheets() SHALL complete in <100ms.

**REQ-8.4.2**: traceCascade() SHALL complete in <50ms per node/property pair.

**REQ-8.4.3**: getComputedStyles() SHALL complete in <30ms per node.

---

## 9. Console Extraction Requirements

### 9.1 Console Message Extraction

**REQ-9.1.1**: System SHALL extract all console messages (log, info, warn, error).

**REQ-9.1.2**: System SHALL include level, text, args, stack trace, timestamp, source for each message.

**REQ-9.1.3**: System SHALL support filtering by level (error, warning, log, info).

**REQ-9.1.4**: System SHALL support filtering by text content.

**REQ-9.1.5**: System SHALL support filtering by source file.

### 9.2 Real-Time Console Subscription

**REQ-9.2.1**: System SHALL support real-time subscription to console messages.

**REQ-9.2.2**: System SHALL invoke callback for each new console message.

**REQ-9.2.3**: System SHALL provide unsubscribe function to stop receiving messages.

**REQ-9.2.4**: System SHALL buffer console messages during tab activation (before subscription).

### 9.3 Stack Trace Mapping

**REQ-9.3.1**: System SHALL map console error stack traces to source files via source maps.

**REQ-9.3.2**: System SHALL include function name, file, line, column for each stack frame.

**REQ-9.3.3**: System SHALL include both runtime and source locations for each frame.

---

## 10. Source Mapping Requirements

### 10.1 Source Map Loading

**REQ-10.1.1**: System SHALL load source maps for all scripts in page.

**REQ-10.1.2**: System SHALL parse source maps using Mozilla source-map library.

**REQ-10.1.3**: System SHALL cache parsed source maps (L1 or L2 cache).

**REQ-10.1.4**: System SHALL emit SourceMapLoaded event when source map is loaded.

**REQ-10.1.5**: System SHALL handle missing source maps gracefully (no error, just no mapping).

### 10.2 Runtime → Source Mapping

**REQ-10.2.1**: System SHALL map runtime file + line + column to source file + line + column.

**REQ-10.2.2**: System SHALL return null if no source map available for runtime file.

**REQ-10.2.3**: System SHALL return null if runtime location not found in source map.

**REQ-10.2.4**: mapToSource() SHALL complete in <10ms per location (cached source map).

### 10.3 Source → Runtime Mapping

**REQ-10.3.1**: System SHALL map source file + line to runtime file + line + column.

**REQ-10.3.2**: System SHALL return null if no source map contains source file.

**REQ-10.3.3**: System SHALL return null if source line not mapped in source map.

**REQ-10.3.4**: mapToRuntime() SHALL complete in <10ms per location (cached source map).

### 10.4 Source Map Integration

**REQ-10.4.1**: System SHALL map DOM nodes to source files (via framework component mapping).

**REQ-10.4.2**: System SHALL map CSS rules to source files (SCSS, LESS, etc.).

**REQ-10.4.3**: System SHALL map console errors to source files (via stack traces).

**REQ-10.4.4**: System SHALL map network requests to source files (if initiated from script).

---

## 11. Network Extraction Requirements

### 11.1 Network Request Tracking

**REQ-11.1.1**: System SHALL track all network requests initiated by page.

**REQ-11.1.2**: System SHALL include URL, method, status, headers, timing for each request.

**REQ-11.1.3**: System SHALL track request/response sizes.

**REQ-11.1.4**: System SHALL track request priority.

**REQ-11.1.5**: System SHALL track request initiator (script, stylesheet, XHR, fetch, etc.).

### 11.2 Network Failure Tracking

**REQ-11.2.1**: System SHALL track failed network requests separately.

**REQ-11.2.2**: System SHALL include error message and error code for failures.

**REQ-11.2.3**: System SHALL map failed requests to source files (if initiated from script).

### 11.3 Network Waterfall

**REQ-11.3.1**: System SHALL provide network waterfall data (timing breakdown per request).

**REQ-11.3.2**: System SHALL include DNS lookup, TCP connect, TLS handshake, request, response timings.

**REQ-11.3.3**: System SHALL support filtering by resource type (script, stylesheet, image, XHR, etc.).

---

## 12. Performance Requirements

### 12.1 Query Performance Targets

**REQ-12.1.1**: DOM tree extraction SHALL complete in <100ms for typical page.

**REQ-12.1.2**: DOM node query SHALL complete in <50ms per query.

**REQ-12.1.3**: CSS cascade trace SHALL complete in <50ms per node/property pair.

**REQ-12.1.4**: Console message retrieval SHALL complete in <30ms.

**REQ-12.1.5**: Framework detection SHALL complete in <200ms.

**REQ-12.1.6**: Source map loading SHALL complete in <500ms for typical app.

**REQ-12.1.7**: Source location mapping SHALL complete in <10ms per location (cached).

**REQ-12.1.8**: MCP resource read SHALL complete in <100ms for 90% of queries.

### 12.2 Caching Requirements

**REQ-12.2.1**: System SHALL implement L1 cache (in-memory) for hot data.

**REQ-12.2.2**: L1 cache SHALL use LRU eviction with max 100 items.

**REQ-12.2.3**: L1 cache SHALL provide <5ms access time.

**REQ-12.2.4**: System MAY implement L2 cache (Redis) for warm data.

**REQ-12.2.5**: L2 cache SHALL use TTL eviction (5 min default).

**REQ-12.2.6**: L2 cache SHALL provide <20ms access time.

**REQ-12.2.7**: System SHALL invalidate DOM cache on DOM.documentUpdated event.

**REQ-12.2.8**: System SHALL invalidate CSS cache on CSS.styleSheetChanged event.

**REQ-12.2.9**: System SHALL invalidate framework cache on tab navigation.

### 12.3 Query Optimization

**REQ-12.3.1**: System SHALL support batch DOM node queries (single CDP call for multiple nodes).

**REQ-12.3.2**: System SHALL support incremental DOM loading (max depth parameter).

**REQ-12.3.3**: System SHALL support selective CSS rule loading (filter by selector).

**REQ-12.3.4**: System SHALL log slow queries (>100ms) for performance monitoring.

---

## 13. Event-Driven Architecture Requirements

### 13.1 Event Bus

**REQ-13.1.1**: System SHALL use EventEmitter3 for all cross-component communication.

**REQ-13.1.2**: System SHALL emit events with past-tense verb names (e.g., TabActivated, FrameworkDetected).

**REQ-13.1.3**: System SHALL provide typed event payloads (EventSchemas).

**REQ-13.1.4**: System SHALL make events immutable once created.

**REQ-13.1.5**: Event handlers SHALL be idempotent where possible.

### 13.2 Event Types

**REQ-13.2.1**: System SHALL emit TabActivated event with payload `{ tabId, url, port, timestamp }`.

**REQ-13.2.2**: System SHALL emit TabDeactivated event with payload `{ tabId, timestamp }`.

**REQ-13.2.3**: System SHALL emit FrameworkDetected event with payload `{ tabId, framework, timestamp }`.

**REQ-13.2.4**: System SHALL emit DOMUpdated event with payload `{ tabId, nodeCount, timestamp }`.

**REQ-13.2.5**: System SHALL emit ResourceRequested event with payload `{ resourceURI, tabId, timestamp }`.

**REQ-13.2.6**: System SHALL emit PortAllocated event with payload `{ port, tabId, timestamp }`.

**REQ-13.2.7**: System SHALL emit SourceMapLoaded event with payload `{ tabId, url, timestamp }`.

**REQ-13.2.8**: System SHALL emit ConsoleMessage event with payload `{ tabId, level, text, timestamp }`.

---

## 14. Interface Segregation Principle (ISP) Requirements

### 14.1 Contract Structure

**REQ-14.1.1**: ALL interfaces SHALL be in separate `contracts/` package.

**REQ-14.1.2**: `contracts/` package SHALL have ZERO implementation code.

**REQ-14.1.3**: `contracts/` package SHALL have ZERO runtime dependencies.

**REQ-14.1.4**: `contracts/` package SHALL be independently versioned (semantic versioning).

**REQ-14.1.5**: `contracts/` package SHALL be published as separate package/library.

### 14.2 Interface Immutability

**REQ-14.2.1**: Existing interface methods SHALL NEVER be modified (breaking change).

**REQ-14.2.2**: Breaking changes SHALL require new interface version (e.g., IServiceV2).

**REQ-14.2.3**: New methods SHALL be added as MINOR version bump (v1.1.0).

**REQ-14.2.4**: Documentation changes SHALL be PATCH version bump (v1.0.1).

**REQ-14.2.5**: Deprecated interfaces SHALL remain in codebase with deprecation notice.

### 14.3 Dependency Rules

**REQ-14.3.1**: `core/` package SHALL depend ONLY on `contracts/`.

**REQ-14.3.2**: `infrastructure/` package SHALL depend ONLY on `contracts/`.

**REQ-14.3.3**: `mcp-server/` package SHALL depend ONLY on `contracts/`.

**REQ-14.3.4**: `extension-*` packages SHALL depend ONLY on `contracts/`.

**REQ-14.3.5**: NO package SHALL depend on implementation packages (core, infrastructure, etc.).

**REQ-14.3.6**: Implementations SHALL be composed via dependency injection at runtime.

---

## 15. Test-Driven Development (TDD) Requirements

### 15.1 TDD Workflow

**REQ-15.1.1**: Interface contracts SHALL be defined BEFORE any implementation.

**REQ-15.1.2**: Test infrastructure SHALL be set up BEFORE writing tests.

**REQ-15.1.3**: Tests SHALL be written BEFORE implementation (RED phase).

**REQ-15.1.4**: Implementation SHALL make tests pass (GREEN phase).

**REQ-15.1.5**: Implementation SHALL be refactored with passing tests (BLUE phase).

**REQ-15.1.6**: Integration tests SHALL compose real implementations via DI.

### 15.2 Real Implementation Testing

**REQ-15.2.1**: Tests SHALL use real browser instances (Puppeteer/Playwright).

**REQ-15.2.2**: Tests SHALL NOT use mocks for browser behavior.

**REQ-15.2.3**: Tests SHALL use real browser protocols (CDP/RDP/WebKit).

**REQ-15.2.4**: Tests SHALL use real source-map library.

**REQ-15.2.5**: Tests SHALL use real EventEmitter3 instance.

**REQ-15.2.6**: Tests SHALL use real MCP SDK (@modelcontextprotocol/sdk).

**REQ-15.2.7**: Tests MAY use Docker containers for local services (Redis).

### 15.3 Test Infrastructure

**REQ-15.3.1**: Test infrastructure SHALL provide ChromeTestInstance (Puppeteer).

**REQ-15.3.2**: Test infrastructure SHALL provide FirefoxTestInstance (Playwright).

**REQ-15.3.3**: Test infrastructure SHALL provide SafariTestInstance (Playwright).

**REQ-15.3.4**: Test infrastructure SHALL provide 17+ test apps (one per framework).

**REQ-15.3.5**: Test infrastructure SHALL provide DevServerManager for test apps.

**REQ-15.3.6**: Test infrastructure SHALL provide BrowserPool for fast test execution.

**REQ-15.3.7**: Test infrastructure SHALL provide Docker Compose for local services.

### 15.4 Test Categories

**REQ-15.4.1**: Unit tests SHALL test single interface implementation.

**REQ-15.4.2**: Unit tests SHALL use real browser instance.

**REQ-15.4.3**: Unit tests SHALL complete in 100-500ms per test.

**REQ-15.4.4**: Integration tests SHALL compose multiple interfaces via DI.

**REQ-15.4.5**: Integration tests SHALL use real browser + real MCP server.

**REQ-15.4.6**: Integration tests SHALL complete in 500ms-2s per test.

**REQ-15.4.7**: E2E tests SHALL test full extension with real AI assistant.

**REQ-15.4.8**: E2E tests SHALL complete in 5-10s per test.

### 15.5 Test Coverage

**REQ-15.5.1**: Test coverage SHALL be >80% for all packages.

**REQ-15.5.2**: All interface implementations SHALL have unit tests.

**REQ-15.5.3**: All interface compositions SHALL have integration tests.

**REQ-15.5.4**: All user workflows SHALL have E2E tests.

---

## 16. Package Structure Requirements

### 16.1 Monorepo Organization

**REQ-16.1.1**: Project SHALL use monorepo structure.

**REQ-16.1.2**: Monorepo SHALL include following packages:
- `contracts/` (interfaces)
- `core/` (business logic implementations)
- `infrastructure/` (protocol adapters, event bus, caching)
- `mcp-server/` (MCP server implementation)
- `extension-chromium/` (Chrome/Edge extension)
- `extension-firefox/` (Firefox extension)
- `extension-safari/` (Safari extension)
- `test-harnesses/` (test infrastructure)

**REQ-16.1.3**: Each package SHALL have independent package.json.

**REQ-16.1.4**: Each package SHALL have independent versioning.

**REQ-16.1.5**: Monorepo MAY use Turborepo for build optimization.

### 16.2 Package Dependencies

**REQ-16.2.1**: All packages SHALL declare `contracts/` as dependency.

**REQ-16.2.2**: `extension-chromium/` SHALL bundle `core/`, `infrastructure/`, `mcp-server/` at build time.

**REQ-16.2.3**: `extension-firefox/` SHALL bundle `core/`, `infrastructure/`, `mcp-server/` at build time.

**REQ-16.2.4**: `extension-safari/` SHALL bundle `core/`, `infrastructure/`, `mcp-server/` at build time.

---

## 17. Technology Stack Requirements

### 17.1 Core Technologies

**REQ-17.1.1**: System SHALL use TypeScript 5.3+.

**REQ-17.1.2**: System SHALL use Browser Extension APIs (chrome.*, browser.*, safari.*).

**REQ-17.1.3**: System SHALL use EventEmitter3 for event bus.

**REQ-17.1.4**: System SHALL use @modelcontextprotocol/sdk for MCP protocol.

**REQ-17.1.5**: System SHALL use source-map library for source map parsing.

**REQ-17.1.6**: System SHALL use Vitest for unit/integration testing.

**REQ-17.1.7**: System SHALL use Puppeteer for Chrome testing.

**REQ-17.1.8**: System SHALL use Playwright for cross-browser testing.

### 17.2 Optional Technologies

**REQ-17.2.1**: System MAY use Redis for L2 caching.

**REQ-17.2.2**: System MAY use Turborepo for monorepo builds.

**REQ-17.2.3**: System MAY use Docker for local test services.

---

## 18. Deployment Requirements

### 18.1 Chrome Web Store

**REQ-18.1.1**: Chrome extension SHALL be submitted to Chrome Web Store.

**REQ-18.1.2**: Extension SHALL comply with Chrome Web Store policies.

**REQ-18.1.3**: Extension SHALL use Manifest v3.

**REQ-18.1.4**: Extension SHALL request minimum required permissions.

### 18.2 Firefox Add-ons

**REQ-18.2.1**: Firefox extension SHALL be submitted to Firefox Add-ons.

**REQ-18.2.2**: Extension SHALL comply with Firefox Add-ons policies.

**REQ-18.2.3**: Extension SHALL use WebExtensions API.

### 18.3 Safari Extensions

**REQ-18.3.1**: Safari extension SHALL be submitted to Safari Extensions.

**REQ-18.3.2**: Extension SHALL comply with Safari Extensions policies.

**REQ-18.3.3**: Extension SHALL use Safari Extensions API.

---

## 19. Documentation Requirements

**REQ-19.1**: System SHALL provide user guide for extension installation and usage.

**REQ-19.2**: System SHALL provide API documentation for all interfaces (TypeDoc).

**REQ-19.3**: System SHALL provide developer guide for contributing.

**REQ-19.4**: System SHALL provide architecture decision records (ADRs) for major decisions.

**REQ-19.5**: System SHALL provide troubleshooting guide for common issues.

---

## Requirements Summary

**Total Requirements**: 389 numbered requirements across 19 categories

**Critical Requirements** (marked with SHALL): 385
**Optional Requirements** (marked with MAY): 4

**Compliance**: All designs SHALL satisfy 100% of SHALL requirements.

---

**END OF NUMBERED REQUIREMENTS**

All requirements are sourced from REQUIREMENTS.md and organized by functional category for systematic validation during implementation and testing.
