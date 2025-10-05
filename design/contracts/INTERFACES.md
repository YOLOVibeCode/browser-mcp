# Interface Contracts Design - ISP Enforcement

**Version**: 1.0
**Date**: 2025-01-05
**Status**: Architecture Phase
**Compliance**: Interface Segregation Principle (ISP) - NON-NEGOTIABLE

---

## Table of Contents

1. [ISP Principles](#1-isp-principles)
2. [Interface Versioning Strategy](#2-interface-versioning-strategy)
3. [MCP Server Interfaces](#3-mcp-server-interfaces)
4. [Business Logic Interfaces](#4-business-logic-interfaces)
5. [Protocol Adapter Interfaces](#5-protocol-adapter-interfaces)
6. [Event Bus Interfaces](#6-event-bus-interfaces)
7. [Data Type Definitions](#7-data-type-definitions)
8. [Dependency Injection Setup](#8-dependency-injection-setup)

---

## 1. ISP Principles

### 1.1 Immutable Contract Rules

Per `.cursorrules`, these rules are **MANDATORY**:

1. **Separate Project**: ALL interfaces in `contracts/` project (zero implementation code)
2. **Zero Dependencies**: `contracts/` has NO external dependencies
3. **Semantic Versioning**: Breaking changes = new interface (e.g., `IServiceV2`)
4. **Immutable Once Published**: NEVER modify existing interface methods
5. **Interface-First Development**: Define interface BEFORE any implementation

### 1.2 contracts/ Project Structure

```
contracts/
├── package.json                # Independently versioned (v1.0.0)
├── tsconfig.json              # Strict TypeScript config
├── mcp-server/
│   ├── IMCPServer.ts
│   ├── ITabManager.ts
│   ├── IPortManager.ts
│   ├── IResourceProvider.ts
│   ├── IToolProvider.ts
│   └── IPromptProvider.ts
├── business-logic/
│   ├── IFrameworkDetector.ts
│   ├── IDOMExtractor.ts
│   ├── ICSSExtractor.ts
│   ├── IConsoleExtractor.ts
│   ├── INetworkExtractor.ts
│   ├── IPerformanceExtractor.ts
│   ├── ISourceMapper.ts
│   └── IComponentInspector.ts
├── protocol-adapters/
│   ├── IBrowserProtocolAdapter.ts
│   ├── ICDPAdapter.ts          # Chrome DevTools Protocol
│   ├── IRDPAdapter.ts          # Firefox Remote Debugging
│   └── IWebKitAdapter.ts       # Safari WebKit Inspector
├── events/
│   ├── IEventBus.ts
│   └── EventSchemas.ts         # Event payload type definitions
└── types/
    ├── DOMTypes.ts
    ├── CSSTypes.ts
    ├── ConsoleTypes.ts
    ├── NetworkTypes.ts
    ├── PerformanceTypes.ts
    ├── FrameworkTypes.ts
    ├── SourceMapTypes.ts
    └── MCPTypes.ts
```

### 1.3 Package Configuration

**contracts/package.json**:
```json
{
  "name": "@browser-mcp/contracts",
  "version": "1.0.0",
  "description": "Immutable interface contracts for Browser MCP Family",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": "./dist/index.js",
    "./mcp-server": "./dist/mcp-server/index.js",
    "./business-logic": "./dist/business-logic/index.js",
    "./protocol-adapters": "./dist/protocol-adapters/index.js",
    "./events": "./dist/events/index.js",
    "./types": "./dist/types/index.js"
  },
  "scripts": {
    "build": "tsc",
    "test": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.3.0"
  },
  "peerDependencies": {},
  "dependencies": {}
}
```

**Key Points**:
- **NO runtime dependencies** - only TypeScript types
- **Strict versioning** - semantic versioning enforced
- **Published package** - other projects depend on specific version

---

## 2. Interface Versioning Strategy

### 2.1 Versioning Rules

| Change Type | Version Bump | Action Required |
|-------------|-------------|-----------------|
| **Breaking Change** | MAJOR (v2.0.0) | Create new interface `IServiceV2` |
| **Add New Method** | MINOR (v1.1.0) | Add method to existing interface |
| **Add Optional Parameter** | MINOR (v1.1.0) | Use optional parameters `param?:` |
| **Documentation Only** | PATCH (v1.0.1) | Update JSDoc comments |
| **Type Fix (non-breaking)** | PATCH (v1.0.2) | Fix typo in type name |

### 2.2 Breaking Change Example

**v1.0.0** (Original):
```typescript
// contracts/business-logic/IFrameworkDetector.ts
export interface IFrameworkDetector {
  /**
   * Detects framework for a given DOM node.
   * @param nodeId - DOM node ID from CDP
   * @returns Framework data or null if not detected
   */
  detect(nodeId: number): Promise<FrameworkData | null>;
}
```

**v1.1.0** (Non-breaking addition):
```typescript
// contracts/business-logic/IFrameworkDetector.ts
export interface IFrameworkDetector {
  detect(nodeId: number): Promise<FrameworkData | null>;

  /**
   * NEW METHOD - Detects all frameworks in the page.
   * @returns Array of detected frameworks
   */
  detectAll(): Promise<FrameworkData[]>; // ADDED - non-breaking
}
```

**v2.0.0** (Breaking change - NEW interface):
```typescript
// contracts/business-logic/IFrameworkDetectorV2.ts
export interface IFrameworkDetectorV2 {
  /**
   * Detects framework with optional configuration.
   * BREAKING: Changed signature by adding options parameter.
   */
  detect(nodeId: number, options?: DetectOptions): Promise<FrameworkData | null>;

  detectAll(): Promise<FrameworkData[]>;
}

// OLD interface still exists for backward compatibility:
// IFrameworkDetector (v1.x) remains unchanged
```

### 2.3 Deprecation Strategy

```typescript
/**
 * @deprecated Use IFrameworkDetectorV2 instead.
 * This interface will be removed in v3.0.0.
 * Migration guide: https://docs.browser-mcp.com/migration/v2
 */
export interface IFrameworkDetector {
  detect(nodeId: number): Promise<FrameworkData | null>;
}
```

---

## 3. MCP Server Interfaces

### 3.1 IMCPServer

**Purpose**: Main MCP server interface - handles MCP protocol, tab management, resource/tool/prompt providers.

**File**: `contracts/mcp-server/IMCPServer.ts`

```typescript
import { ITabManager } from './ITabManager';
import { IPortManager } from './IPortManager';
import { IResourceProvider } from './IResourceProvider';
import { IToolProvider } from './IToolProvider';
import { IPromptProvider } from './IPromptProvider';

/**
 * Main MCP server interface.
 * Embedded in browser extension service worker.
 */
export interface IMCPServer {
  /**
   * Starts the MCP server on a given port.
   * @param port - Port number allocated by IPortManager
   * @throws {PortInUseError} if port is already bound
   */
  start(port: number): Promise<void>;

  /**
   * Stops the MCP server and releases port.
   */
  stop(): Promise<void>;

  /**
   * Registers a resource provider (e.g., console, DOM, CSS).
   * @param provider - Resource provider implementation
   */
  registerResourceProvider(provider: IResourceProvider): void;

  /**
   * Registers a tool provider (e.g., query DOM, trace CSS cascade).
   * @param provider - Tool provider implementation
   */
  registerToolProvider(provider: IToolProvider): void;

  /**
   * Registers a prompt provider for AI context.
   * @param provider - Prompt provider implementation
   */
  registerPromptProvider(provider: IPromptProvider): void;

  /**
   * Gets the tab manager instance.
   */
  getTabManager(): ITabManager;

  /**
   * Gets the port manager instance.
   */
  getPortManager(): IPortManager;

  /**
   * Server status.
   */
  readonly isRunning: boolean;

  /**
   * Current server port.
   */
  readonly port: number | null;
}
```

### 3.2 ITabManager

**Purpose**: Manages active browser tabs, virtual filesystems, and tab lifecycle.

**File**: `contracts/mcp-server/ITabManager.ts`

```typescript
import { TabInfo } from '../types/MCPTypes';

/**
 * Manages active browser tabs and their virtual filesystems.
 */
export interface ITabManager {
  /**
   * Activates debugging for a tab.
   * @param tabId - Browser tab ID
   * @param url - Tab URL (used for virtual filesystem mount point)
   * @param port - MCP server port for this tab
   * @emits TabActivated event
   */
  activateTab(tabId: number, url: string, port: number): Promise<void>;

  /**
   * Deactivates debugging for a tab.
   * @param tabId - Browser tab ID
   * @emits TabDeactivated event
   */
  deactivateTab(tabId: number): Promise<void>;

  /**
   * Gets information about an active tab.
   * @param tabId - Browser tab ID
   * @returns Tab info or null if not active
   */
  getTabInfo(tabId: number): TabInfo | null;

  /**
   * Gets all active tabs.
   * @returns Array of active tab info
   */
  getAllActiveTabs(): TabInfo[];

  /**
   * Checks if a tab is active.
   */
  isTabActive(tabId: number): boolean;

  /**
   * Gets virtual filesystem URI for a tab.
   * Example: browser://tab-localhost-3000/
   */
  getVirtualFilesystemURI(tabId: number): string | null;
}
```

### 3.3 IPortManager

**Purpose**: Smart port allocation for multi-tab support.

**File**: `contracts/mcp-server/IPortManager.ts`

```typescript
/**
 * Smart port allocation manager.
 * Handles port conflicts, allocation, and release.
 */
export interface IPortManager {
  /**
   * Finds an available port in the configured range.
   * Default range: 3100-3199
   * Fallback range: 3200-3299
   * @returns Available port number
   * @throws {NoAvailablePortError} if no ports available
   * @emits PortAllocated event
   */
  findAvailablePort(): Promise<number>;

  /**
   * Checks if a specific port is available.
   * @param port - Port number to check
   * @returns true if available, false otherwise
   */
  isPortAvailable(port: number): Promise<boolean>;

  /**
   * Reserves a port for a tab.
   * @param tabId - Browser tab ID
   * @param port - Port number
   * @throws {PortAlreadyReservedError} if port already reserved
   */
  reservePort(tabId: number, port: number): void;

  /**
   * Releases a port from a tab.
   * @param tabId - Browser tab ID
   */
  releasePort(tabId: number): void;

  /**
   * Gets the port reserved for a tab.
   * @param tabId - Browser tab ID
   * @returns Port number or null if not reserved
   */
  getPortForTab(tabId: number): number | null;

  /**
   * Gets the tab ID for a reserved port.
   * @param port - Port number
   * @returns Tab ID or null if port not reserved
   */
  getTabForPort(port: number): number | null;

  /**
   * Gets all reserved ports with their tab IDs.
   * @returns Map of tabId -> port
   */
  getAllReservedPorts(): Map<number, number>;
}
```

### 3.4 IResourceProvider

**Purpose**: Base interface for MCP resource providers (console, DOM, CSS, etc.).

**File**: `contracts/mcp-server/IResourceProvider.ts`

```typescript
import { MCPResource, ResourceURI } from '../types/MCPTypes';

/**
 * Base interface for MCP resource providers.
 * Resource providers expose browser state as queryable MCP resources.
 */
export interface IResourceProvider {
  /**
   * Resource provider name.
   * Examples: "console", "dom", "css", "network"
   */
  readonly name: string;

  /**
   * Lists all available resources for a tab.
   * @param tabId - Browser tab ID
   * @returns Array of resource URIs
   * Example: ["browser://tab-localhost-3000/console/errors"]
   */
  listResources(tabId: number): Promise<ResourceURI[]>;

  /**
   * Reads a specific resource.
   * @param tabId - Browser tab ID
   * @param resourceURI - Full resource URI
   * @returns Resource data (text, JSON, HTML, etc.)
   * @throws {ResourceNotFoundError} if resource doesn't exist
   */
  readResource(tabId: number, resourceURI: ResourceURI): Promise<MCPResource>;

  /**
   * Checks if a resource exists.
   * @param tabId - Browser tab ID
   * @param resourceURI - Full resource URI
   */
  resourceExists(tabId: number, resourceURI: ResourceURI): Promise<boolean>;
}
```

### 3.5 IToolProvider

**Purpose**: Base interface for MCP tool providers (query DOM, trace CSS, etc.).

**File**: `contracts/mcp-server/IToolProvider.ts`

```typescript
import { MCPToolResult } from '../types/MCPTypes';

/**
 * Base interface for MCP tool providers.
 * Tools are actions AI can invoke to interact with browser state.
 */
export interface IToolProvider {
  /**
   * Tool provider name.
   * Examples: "query-dom", "trace-css-cascade", "get-component-state"
   */
  readonly name: string;

  /**
   * Tool description for AI.
   */
  readonly description: string;

  /**
   * JSON schema for tool parameters.
   */
  readonly inputSchema: object;

  /**
   * Executes the tool.
   * @param tabId - Browser tab ID
   * @param parameters - Tool parameters (validated against inputSchema)
   * @returns Tool execution result
   */
  execute(tabId: number, parameters: Record<string, unknown>): Promise<MCPToolResult>;
}
```

### 3.6 IPromptProvider

**Purpose**: Provides AI context prompts for debugging scenarios.

**File**: `contracts/mcp-server/IPromptProvider.ts`

```typescript
import { MCPPrompt } from '../types/MCPTypes';

/**
 * Provides AI context prompts for debugging scenarios.
 */
export interface IPromptProvider {
  /**
   * Gets debugging context prompts for a tab.
   * @param tabId - Browser tab ID
   * @returns Array of prompts with debugging context
   */
  getPromptsForTab(tabId: number): Promise<MCPPrompt[]>;

  /**
   * Gets a specific prompt by name.
   * @param name - Prompt name (e.g., "debug-console-error")
   */
  getPrompt(name: string): MCPPrompt | null;
}
```

---

## 4. Business Logic Interfaces

### 4.1 IFrameworkDetector

**Purpose**: Detects web frameworks/libraries in a browser tab.

**File**: `contracts/business-logic/IFrameworkDetector.ts`

```typescript
import { FrameworkData } from '../types/FrameworkTypes';

/**
 * Universal framework detector.
 * Detects 17+ frameworks: React, Vue, Angular, Svelte, Blazor, Solid, etc.
 */
export interface IFrameworkDetector {
  /**
   * Detects framework for a given DOM node.
   * @param tabId - Browser tab ID
   * @param nodeId - DOM node ID from CDP/RDP/WebKit
   * @returns Framework data or null if not detected
   * @emits FrameworkDetected event if framework found
   */
  detect(tabId: number, nodeId: number): Promise<FrameworkData | null>;

  /**
   * Detects all frameworks in the page.
   * @param tabId - Browser tab ID
   * @returns Array of detected frameworks (may be multiple)
   */
  detectAll(tabId: number): Promise<FrameworkData[]>;

  /**
   * Gets component data for a framework-specific node.
   * @param tabId - Browser tab ID
   * @param nodeId - DOM node ID
   * @param framework - Framework name (from detect())
   * @returns Component state, props, source location, etc.
   */
  getComponentData(tabId: number, nodeId: number, framework: string): Promise<object | null>;
}
```

### 4.2 IDOMExtractor

**Purpose**: Extracts structured DOM data from browser.

**File**: `contracts/business-logic/IDOMExtractor.ts`

```typescript
import { DOMTree, DOMNode, DOMQuery } from '../types/DOMTypes';

/**
 * DOM data extractor.
 * Provides structured DOM tree, node queries, and element inspection.
 */
export interface IDOMExtractor {
  /**
   * Gets the full DOM tree as structured data.
   * @param tabId - Browser tab ID
   * @returns Complete DOM tree (JSON serializable)
   */
  getDOMTree(tabId: number): Promise<DOMTree>;

  /**
   * Gets a specific DOM node by ID.
   * @param tabId - Browser tab ID
   * @param nodeId - DOM node ID from CDP/RDP/WebKit
   * @returns DOM node data or null if not found
   */
  getDOMNode(tabId: number, nodeId: number): Promise<DOMNode | null>;

  /**
   * Queries DOM using CSS selector.
   * @param tabId - Browser tab ID
   * @param selector - CSS selector (e.g., ".button", "#header")
   * @returns Array of matching DOM nodes
   */
  queryDOM(tabId: number, selector: string): Promise<DOMNode[]>;

  /**
   * Gets HTML representation of DOM tree.
   * @param tabId - Browser tab ID
   * @returns Full HTML string
   */
  getDOMHTML(tabId: number): Promise<string>;
}
```

### 4.3 ICSSExtractor

**Purpose**: Extracts CSS data and traces cascade.

**File**: `contracts/business-logic/ICSSExtractor.ts`

```typescript
import { CSSStylesheet, CSSCascade, CSSIssue } from '../types/CSSTypes';

/**
 * CSS data extractor and cascade tracer.
 */
export interface ICSSExtractor {
  /**
   * Gets all stylesheets in the page.
   * @param tabId - Browser tab ID
   * @returns Array of stylesheet data
   */
  getStylesheets(tabId: number): Promise<CSSStylesheet[]>;

  /**
   * Traces CSS cascade for a specific DOM node and property.
   * @param tabId - Browser tab ID
   * @param nodeId - DOM node ID
   * @param property - CSS property (e.g., "display", "color")
   * @returns Cascade trace showing all matching rules
   */
  traceCascade(tabId: number, nodeId: number, property: string): Promise<CSSCascade>;

  /**
   * Gets computed styles for a DOM node.
   * @param tabId - Browser tab ID
   * @param nodeId - DOM node ID
   * @returns Map of property -> computed value
   */
  getComputedStyles(tabId: number, nodeId: number): Promise<Map<string, string>>;

  /**
   * Detects CSS issues (unused rules, specificity conflicts, etc.).
   * @param tabId - Browser tab ID
   * @returns Array of detected issues
   */
  detectCSSIssues(tabId: number): Promise<CSSIssue[]>;
}
```

### 4.4 IConsoleExtractor

**Purpose**: Extracts console messages, errors, warnings.

**File**: `contracts/business-logic/IConsoleExtractor.ts`

```typescript
import { ConsoleMessage } from '../types/ConsoleTypes';

/**
 * Console data extractor.
 */
export interface IConsoleExtractor {
  /**
   * Gets all console messages for a tab.
   * @param tabId - Browser tab ID
   * @param filter - Optional filter (level, text, source)
   * @returns Array of console messages
   */
  getConsoleMessages(tabId: number, filter?: ConsoleFilter): Promise<ConsoleMessage[]>;

  /**
   * Gets only console errors.
   * @param tabId - Browser tab ID
   */
  getConsoleErrors(tabId: number): Promise<ConsoleMessage[]>;

  /**
   * Gets only console warnings.
   * @param tabId - Browser tab ID
   */
  getConsoleWarnings(tabId: number): Promise<ConsoleMessage[]>;

  /**
   * Subscribes to real-time console messages.
   * @param tabId - Browser tab ID
   * @param callback - Called for each new console message
   * @returns Unsubscribe function
   */
  subscribeToConsole(tabId: number, callback: (message: ConsoleMessage) => void): () => void;
}

export interface ConsoleFilter {
  level?: 'log' | 'info' | 'warn' | 'error';
  textContains?: string;
  source?: string;
}
```

### 4.5 ISourceMapper

**Purpose**: Maps runtime state to source files via source maps.

**File**: `contracts/business-logic/ISourceMapper.ts`

```typescript
import { SourceLocation, SourceMapData } from '../types/SourceMapTypes';

/**
 * Source map integration.
 * Maps runtime state (DOM nodes, console errors) back to source files.
 */
export interface ISourceMapper {
  /**
   * Loads source maps for a tab.
   * @param tabId - Browser tab ID
   * @emits SourceMapLoaded event
   */
  loadSourceMaps(tabId: number): Promise<void>;

  /**
   * Maps a runtime location to source location.
   * @param tabId - Browser tab ID
   * @param runtimeFile - Runtime file URL (e.g., bundle.js)
   * @param line - Runtime line number
   * @param column - Runtime column number
   * @returns Source location or null if not mapped
   */
  mapToSource(tabId: number, runtimeFile: string, line: number, column: number): Promise<SourceLocation | null>;

  /**
   * Maps a source location to runtime location.
   * @param tabId - Browser tab ID
   * @param sourceFile - Source file path (e.g., Button.tsx)
   * @param line - Source line number
   * @returns Runtime location or null if not mapped
   */
  mapToRuntime(tabId: number, sourceFile: string, line: number): Promise<SourceLocation | null>;

  /**
   * Gets all source maps for a tab.
   * @param tabId - Browser tab ID
   */
  getSourceMaps(tabId: number): Promise<SourceMapData[]>;
}
```

---

## 5. Protocol Adapter Interfaces

### 5.1 IBrowserProtocolAdapter

**Purpose**: Base interface for browser debugging protocol adapters.

**File**: `contracts/protocol-adapters/IBrowserProtocolAdapter.ts`

```typescript
/**
 * Base interface for browser debugging protocol adapters.
 * Implemented by CDP (Chrome), RDP (Firefox), WebKit (Safari).
 */
export interface IBrowserProtocolAdapter {
  /**
   * Browser name.
   * Examples: "chrome", "firefox", "safari"
   */
  readonly browser: string;

  /**
   * Protocol name.
   * Examples: "CDP", "RDP", "WebKit"
   */
  readonly protocol: string;

  /**
   * Connects to browser debugging protocol.
   * @param tabId - Browser tab ID
   * @throws {ConnectionError} if connection fails
   */
  connect(tabId: number): Promise<void>;

  /**
   * Disconnects from browser debugging protocol.
   * @param tabId - Browser tab ID
   */
  disconnect(tabId: number): Promise<void>;

  /**
   * Sends a protocol command.
   * @param tabId - Browser tab ID
   * @param method - Protocol method (e.g., "Runtime.evaluate")
   * @param params - Method parameters
   * @returns Protocol response
   */
  send<T = unknown>(tabId: number, method: string, params?: object): Promise<T>;

  /**
   * Subscribes to protocol events.
   * @param tabId - Browser tab ID
   * @param event - Event name (e.g., "Console.messageAdded")
   * @param callback - Event callback
   * @returns Unsubscribe function
   */
  on(tabId: number, event: string, callback: (params: unknown) => void): () => void;

  /**
   * Checks if connected to a tab.
   */
  isConnected(tabId: number): boolean;
}
```

### 5.2 ICDPAdapter

**Purpose**: Chrome DevTools Protocol adapter (Chrome/Edge).

**File**: `contracts/protocol-adapters/ICDPAdapter.ts`

```typescript
import { IBrowserProtocolAdapter } from './IBrowserProtocolAdapter';

/**
 * Chrome DevTools Protocol (CDP) adapter.
 * Used for Chrome, Edge, and Chromium-based browsers.
 */
export interface ICDPAdapter extends IBrowserProtocolAdapter {
  /**
   * Enables a CDP domain.
   * @param tabId - Browser tab ID
   * @param domain - CDP domain (e.g., "Console", "DOM", "CSS")
   */
  enableDomain(tabId: number, domain: string): Promise<void>;

  /**
   * Disables a CDP domain.
   * @param tabId - Browser tab ID
   * @param domain - CDP domain
   */
  disableDomain(tabId: number, domain: string): Promise<void>;

  /**
   * Gets DOM node ID by selector.
   * CDP-specific convenience method.
   */
  getNodeIdBySelector(tabId: number, selector: string): Promise<number | null>;
}
```

### 5.3 IRDPAdapter

**Purpose**: Firefox Remote Debugging Protocol adapter.

**File**: `contracts/protocol-adapters/IRDPAdapter.ts`

```typescript
import { IBrowserProtocolAdapter } from './IBrowserProtocolAdapter';

/**
 * Firefox Remote Debugging Protocol (RDP) adapter.
 */
export interface IRDPAdapter extends IBrowserProtocolAdapter {
  /**
   * Gets actor ID for a tab.
   * RDP uses actor model - this maps tabId -> actorId.
   */
  getActorId(tabId: number): Promise<string>;

  /**
   * Attaches to a tab actor.
   * RDP-specific connection step.
   */
  attachToTab(tabId: number): Promise<void>;

  /**
   * Detaches from a tab actor.
   */
  detachFromTab(tabId: number): Promise<void>;
}
```

### 5.4 IWebKitAdapter

**Purpose**: Safari WebKit Inspector Protocol adapter.

**File**: `contracts/protocol-adapters/IWebKitAdapter.ts`

```typescript
import { IBrowserProtocolAdapter } from './IBrowserProtocolAdapter';

/**
 * Safari WebKit Inspector Protocol adapter.
 */
export interface IWebKitAdapter extends IBrowserProtocolAdapter {
  /**
   * Enables WebKit timeline.
   * WebKit-specific feature for performance tracing.
   */
  enableTimeline(tabId: number): Promise<void>;

  /**
   * Disables WebKit timeline.
   */
  disableTimeline(tabId: number): Promise<void>;
}
```

---

## 6. Event Bus Interfaces

### 6.1 IEventBus

**Purpose**: Event-driven communication between components.

**File**: `contracts/events/IEventBus.ts`

```typescript
import { EventSchema } from './EventSchemas';

/**
 * Event bus interface.
 * All cross-component communication goes through events.
 * Implementation: EventEmitter3 wrapper.
 */
export interface IEventBus {
  /**
   * Emits an event with payload.
   * @param event - Event name (past-tense verb, e.g., "TabActivated")
   * @param payload - Event payload (must match EventSchema)
   */
  emit<T = unknown>(event: string, payload: T): void;

  /**
   * Subscribes to an event.
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  on<T = unknown>(event: string, handler: (payload: T) => void): () => void;

  /**
   * Subscribes to an event once.
   * Handler is automatically unsubscribed after first invocation.
   */
  once<T = unknown>(event: string, handler: (payload: T) => void): void;

  /**
   * Removes a specific event handler.
   */
  off<T = unknown>(event: string, handler: (payload: T) => void): void;

  /**
   * Removes all handlers for an event.
   */
  removeAllListeners(event?: string): void;
}
```

### 6.2 Event Schemas

**Purpose**: Type-safe event payload definitions.

**File**: `contracts/events/EventSchemas.ts`

```typescript
import { FrameworkData } from '../types/FrameworkTypes';
import { TabInfo } from '../types/MCPTypes';

/**
 * Event payload schemas.
 * All events MUST have typed payloads.
 */

export interface TabActivatedEvent {
  tabId: number;
  url: string;
  port: number;
  timestamp: number;
}

export interface TabDeactivatedEvent {
  tabId: number;
  timestamp: number;
}

export interface FrameworkDetectedEvent {
  tabId: number;
  framework: FrameworkData;
  timestamp: number;
}

export interface DOMUpdatedEvent {
  tabId: number;
  nodeCount: number;
  timestamp: number;
}

export interface ResourceRequestedEvent {
  resourceURI: string;
  tabId: number;
  timestamp: number;
}

export interface PortAllocatedEvent {
  port: number;
  tabId: number;
  timestamp: number;
}

export interface SourceMapLoadedEvent {
  tabId: number;
  url: string;
  timestamp: number;
}

export interface ConsoleMessageEvent {
  tabId: number;
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
  timestamp: number;
}

/**
 * Union type of all event schemas.
 */
export type EventSchema =
  | TabActivatedEvent
  | TabDeactivatedEvent
  | FrameworkDetectedEvent
  | DOMUpdatedEvent
  | ResourceRequestedEvent
  | PortAllocatedEvent
  | SourceMapLoadedEvent
  | ConsoleMessageEvent;
```

---

## 7. Data Type Definitions

### 7.1 MCP Types

**File**: `contracts/types/MCPTypes.ts`

```typescript
/**
 * MCP-specific types.
 */

export type ResourceURI = string; // e.g., "browser://tab-localhost-3000/console/errors"

export interface MCPResource {
  uri: ResourceURI;
  mimeType: string; // "application/json", "text/html", "text/plain"
  content: string | object;
}

export interface MCPToolResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

export interface MCPPrompt {
  name: string;
  description: string;
  content: string;
}

export interface TabInfo {
  tabId: number;
  url: string;
  title: string;
  port: number;
  framework: string | null;
  isActive: boolean;
  virtualFilesystemURI: string;
}
```

### 7.2 Framework Types

**File**: `contracts/types/FrameworkTypes.ts`

```typescript
/**
 * Framework detection types.
 */

export type FrameworkName =
  | 'React'
  | 'Vue'
  | 'Angular'
  | 'Svelte'
  | 'Solid'
  | 'Blazor'
  | 'Preact'
  | 'Qwik'
  | 'Astro'
  | 'Lit'
  | 'Stencil'
  | 'Ember'
  | 'Backbone'
  | 'Aurelia'
  | 'Alpine'
  | 'htmx'
  | 'WebComponent';

export interface FrameworkData {
  name: FrameworkName;
  version: string | null;
  componentData?: ComponentData;
}

export interface ComponentData {
  name: string;
  props?: Record<string, unknown>;
  state?: Record<string, unknown>;
  sourceLocation?: SourceLocation;
}

export interface SourceLocation {
  file: string;
  line: number;
  column: number;
}
```

### 7.3 DOM Types

**File**: `contracts/types/DOMTypes.ts`

```typescript
/**
 * DOM extraction types.
 */

export interface DOMTree {
  root: DOMNode;
  nodeCount: number;
}

export interface DOMNode {
  nodeId: number;
  nodeType: number; // 1 = Element, 3 = Text, etc.
  nodeName: string;
  nodeValue?: string;
  attributes?: Record<string, string>;
  children?: DOMNode[];
  sourceLocation?: SourceLocation;
}

export interface DOMQuery {
  selector: string;
  matches: DOMNode[];
}
```

### 7.4 CSS Types

**File**: `contracts/types/CSSTypes.ts`

```typescript
/**
 * CSS extraction types.
 */

export interface CSSStylesheet {
  url: string;
  rules: CSSRule[];
}

export interface CSSRule {
  selector: string;
  properties: Map<string, string>;
  sourceLocation?: SourceLocation;
}

export interface CSSCascade {
  property: string;
  computedValue: string;
  matchingRules: CSSRule[];
}

export interface CSSIssue {
  type: 'unused-rule' | 'specificity-conflict' | 'invalid-property';
  message: string;
  rule?: CSSRule;
}
```

### 7.5 Console Types

**File**: `contracts/types/ConsoleTypes.ts`

```typescript
/**
 * Console extraction types.
 */

export interface ConsoleMessage {
  level: 'log' | 'info' | 'warn' | 'error';
  text: string;
  args?: unknown[];
  stackTrace?: StackFrame[];
  timestamp: number;
  source?: string;
}

export interface StackFrame {
  functionName: string;
  file: string;
  line: number;
  column: number;
  sourceLocation?: SourceLocation; // Mapped via source maps
}
```

---

## 8. Dependency Injection Setup

### 8.1 Container Interface

**File**: `contracts/di/IContainer.ts` (optional - can use existing DI libraries)

```typescript
/**
 * Dependency injection container interface.
 * Optional - can use existing libraries like tsyringe, inversify.
 */
export interface IContainer {
  /**
   * Registers an interface implementation.
   */
  register<T>(token: symbol | string, implementation: new (...args: unknown[]) => T): void;

  /**
   * Resolves an interface implementation.
   */
  resolve<T>(token: symbol | string): T;
}
```

### 8.2 DI Setup Example

**File**: `extension-chromium/background/di-setup.ts` (implementation, not in contracts)

```typescript
// This is an EXAMPLE - not part of contracts package
import { Container } from 'tsyringe';
import { IMCPServer } from '@browser-mcp/contracts/mcp-server';
import { IFrameworkDetector } from '@browser-mcp/contracts/business-logic';
import { ICDPAdapter } from '@browser-mcp/contracts/protocol-adapters';
import { MCPServer } from '../../mcp-server/MCPServer';
import { UniversalFrameworkDetector } from '../../core/framework-detection/UniversalFrameworkDetector';
import { CDPAdapter } from '../../infrastructure/protocol-adapters/CDPAdapter';

export function setupDI(): Container {
  const container = new Container();

  // Protocol adapters
  container.register('ICDPAdapter', { useClass: CDPAdapter });

  // Business logic
  container.register('IFrameworkDetector', { useClass: UniversalFrameworkDetector });

  // MCP server
  container.register('IMCPServer', { useClass: MCPServer });

  return container;
}
```

---

## Summary

This design enforces **ISP** by:
1. **Separate `contracts/` project** with zero implementation code
2. **Semantic versioning** with immutable contracts
3. **Interface-first development** workflow
4. **Dependency injection** for all implementations
5. **Event-driven architecture** via `IEventBus`

All implementations in `core/`, `infrastructure/`, `mcp-server/`, and extensions depend **ONLY** on contracts, never on each other directly.

---

**Next Steps**:
1. Implement `contracts/` package (TypeScript interfaces only)
2. Version as v1.0.0
3. Publish to internal registry or use as workspace package
4. All other packages depend on `@browser-mcp/contracts@^1.0.0`
5. Start TDD workflow with interface contracts

See [TDD-STRATEGY.md](../testing/TDD-STRATEGY.md) for test-first implementation workflow.
