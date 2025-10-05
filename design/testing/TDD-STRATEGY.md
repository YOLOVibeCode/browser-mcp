# Test-Driven Development Strategy

**Version**: 1.0
**Date**: 2025-01-05
**Status**: Architecture Phase
**Compliance**: TDD + Real Implementations (NO MOCKS) - NON-NEGOTIABLE

---

## Table of Contents

1. [TDD Principles](#1-tdd-principles)
2. [Real Implementations Strategy](#2-real-implementations-strategy)
3. [Test Infrastructure Setup](#3-test-infrastructure-setup)
4. [TDD Workflow](#4-tdd-workflow)
5. [Test Categories](#5-test-categories)
6. [Browser Test Instances](#6-browser-test-instances)
7. [Test App Templates](#7-test-app-templates)
8. [Performance Testing](#8-performance-testing)
9. [CI/CD Integration](#9-cicd-integration)

---

## 1. TDD Principles

### 1.1 Mandatory TDD Rules (from .cursorrules)

Per `.cursorrules`, these rules are **NON-NEGOTIABLE**:

1. **Interface First**: Define interface contract BEFORE writing tests
2. **Test Infrastructure First**: Set up real browser/services BEFORE writing tests
3. **Red-Green-Refactor**: Write failing test → Implement → Refactor
4. **NO MOCKS**: Use real browser instances, real protocols, real services
5. **Real Local Services**: Docker containers for Redis, databases, etc.
6. **Test Against Interfaces**: Tests use interface contracts, not implementations

### 1.2 Why No Mocks?

From `.cursorrules`:

> **NEVER use mocks when a real local implementation is feasible.**

**Rationale**:
- Mocks don't test real browser behavior (DOM mutations, CSS cascade, protocol quirks)
- Browser protocols (CDP, RDP, WebKit) have complex state machines - mocking these is error-prone
- Real browsers catch integration issues that mocks hide
- Performance testing requires real implementations
- Source map parsing needs real browser source map handling
- Framework detection requires real framework runtime behavior

**When Mocks Are Acceptable** (RARE):
- External paid APIs with no free tier (use stub services instead)
- Hardware interfaces not available locally
- Third-party services with complex authentication

### 1.3 Test Pyramid

```
        ┌─────────────────┐
        │  E2E Tests      │  10% - Full extension + real AI assistant
        │  (Playwright)   │
        ├─────────────────┤
        │ Integration     │  30% - Multiple interfaces composed
        │ Tests (Vitest + │       Real browser + real MCP server
        │ Puppeteer)      │
        ├─────────────────┤
        │  Unit Tests     │  60% - Single interface implementation
        │  (Vitest +      │       Real browser, real protocol
        │  Real Browser)  │
        └─────────────────┘
```

**Key Difference from Traditional Pyramid**:
- Even "unit tests" use **real browsers** (not mocked)
- Fast test execution via browser pooling and caching
- Integration tests compose real implementations via DI

---

## 2. Real Implementations Strategy

### 2.1 What We Use (Instead of Mocks)

| Component | Real Implementation | Why |
|-----------|-------------------|-----|
| **Browser** | Puppeteer/Playwright with real Chrome/Firefox/Safari | Test real CDP/RDP/WebKit protocols |
| **DOM** | Real browser DOM via CDP `DOM.getDocument` | Test actual DOM mutations, queries |
| **CSS** | Real browser CSSOM via CDP `CSS.getMatchedStylesForNode` | Test real cascade resolution |
| **Console** | Real browser console via CDP `Console.messageAdded` | Test real console behavior |
| **Source Maps** | Real source-map library with real .map files | Test actual source map parsing |
| **Cache** | In-memory Map (L1) or local Redis (L2) | Test real cache eviction policies |
| **Event Bus** | Real EventEmitter3 instance | Test real pub/sub behavior |
| **MCP Protocol** | Real `@modelcontextprotocol/sdk` | Test real MCP message handling |

### 2.2 Test Infrastructure Components

```
test-harnesses/
├── browser-instances/
│   ├── ChromeTestInstance.ts      # Puppeteer wrapper for Chrome
│   ├── FirefoxTestInstance.ts     # Playwright wrapper for Firefox
│   └── SafariTestInstance.ts      # Playwright wrapper for Safari
├── test-apps/                     # Real apps for framework detection testing
│   ├── react-app/                 # React 18 app
│   ├── vue-app/                   # Vue 3 app
│   ├── blazor-app/                # Blazor WASM app
│   ├── svelte-app/                # Svelte app
│   └── [13 more frameworks]
├── test-servers/                  # Local dev servers
│   └── DevServerManager.ts        # Manages test app dev servers
└── docker/
    └── docker-compose.test.yml    # Redis, etc. for local testing
```

---

## 3. Test Infrastructure Setup

### 3.1 Docker Compose for Local Services

**File**: `test-harnesses/docker/docker-compose.test.yml`

```yaml
version: '3.8'

services:
  # Redis for L2 cache testing (optional)
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5

  # Optional: MinIO for testing source map storage
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"
      - "9001:9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
      interval: 10s
      timeout: 5s
      retries: 3
```

**Start Test Services**:
```bash
cd test-harnesses/docker
docker-compose -f docker-compose.test.yml up -d
```

### 3.2 Browser Instance Setup

**ChromeTestInstance.ts** (Puppeteer):

```typescript
import puppeteer, { Browser, Page, CDPSession } from 'puppeteer';

/**
 * Real Chrome instance for testing.
 * Uses Puppeteer to launch Chrome with debugging enabled.
 */
export class ChromeTestInstance {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private cdpSession: CDPSession | null = null;

  /**
   * Launches Chrome with CDP enabled.
   */
  async launch(): Promise<void> {
    this.browser = await puppeteer.launch({
      headless: true, // Headless for CI/CD
      devtools: false,
      args: [
        '--remote-debugging-port=9222', // CDP port
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    this.page = await this.browser.newPage();
    this.cdpSession = await this.page.target().createCDPSession();
  }

  /**
   * Navigates to a URL.
   */
  async navigate(url: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.goto(url, { waitUntil: 'networkidle0' });
  }

  /**
   * Sends a CDP command.
   */
  async sendCDPCommand<T = unknown>(method: string, params?: object): Promise<T> {
    if (!this.cdpSession) throw new Error('CDP session not created');
    return this.cdpSession.send(method, params) as Promise<T>;
  }

  /**
   * Subscribes to CDP events.
   */
  onCDPEvent(event: string, handler: (params: unknown) => void): void {
    if (!this.cdpSession) throw new Error('CDP session not created');
    this.cdpSession.on(event, handler);
  }

  /**
   * Gets the browser instance (for advanced usage).
   */
  getBrowser(): Browser {
    if (!this.browser) throw new Error('Browser not launched');
    return this.browser;
  }

  /**
   * Gets the current page.
   */
  getPage(): Page {
    if (!this.page) throw new Error('Page not created');
    return this.page;
  }

  /**
   * Closes the browser.
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      this.cdpSession = null;
    }
  }
}
```

**FirefoxTestInstance.ts** (Playwright):

```typescript
import { Browser, Page, chromium, firefox } from 'playwright';

/**
 * Real Firefox instance for testing.
 * Uses Playwright to launch Firefox with RDP enabled.
 */
export class FirefoxTestInstance {
  private browser: Browser | null = null;
  private page: Page | null = null;

  async launch(): Promise<void> {
    this.browser = await firefox.launch({
      headless: true,
      firefoxUserPrefs: {
        'devtools.debugger.remote-enabled': true,
        'devtools.chrome.enabled': true,
      },
    });

    this.page = await this.browser.newPage();
  }

  async navigate(url: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Sends RDP command (Playwright abstracts RDP via CDP-like API).
   */
  async evaluateInPage<T>(script: string): Promise<T> {
    if (!this.page) throw new Error('Page not created');
    return this.page.evaluate(script) as Promise<T>;
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
```

### 3.3 Test App Development Servers

**DevServerManager.ts**:

```typescript
import { spawn, ChildProcess } from 'child_process';

/**
 * Manages dev servers for test apps.
 */
export class DevServerManager {
  private servers = new Map<string, ChildProcess>();

  /**
   * Starts a test app dev server.
   * @param appName - App name (e.g., "react-app")
   * @param port - Port to run on
   */
  async startApp(appName: string, port: number): Promise<void> {
    const appDir = `${__dirname}/../test-apps/${appName}`;

    // Start dev server (npm run dev or vite)
    const process = spawn('npm', ['run', 'dev', '--', '--port', String(port)], {
      cwd: appDir,
      stdio: 'pipe',
    });

    this.servers.set(appName, process);

    // Wait for server to be ready
    await this.waitForServer(`http://localhost:${port}`, 30000);
  }

  /**
   * Stops a test app dev server.
   */
  stopApp(appName: string): void {
    const process = this.servers.get(appName);
    if (process) {
      process.kill();
      this.servers.delete(appName);
    }
  }

  /**
   * Stops all dev servers.
   */
  stopAll(): void {
    for (const [appName] of this.servers) {
      this.stopApp(appName);
    }
  }

  private async waitForServer(url: string, timeout: number): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const response = await fetch(url);
        if (response.ok) return;
      } catch {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    throw new Error(`Server at ${url} did not start within ${timeout}ms`);
  }
}
```

---

## 4. TDD Workflow

### 4.1 Strict TDD Cycle

```
┌─────────────────────────────────────────────────────────┐
│ 1. INTERFACE FIRST (contracts/)                         │
│    └─ Define interface contract                         │
│    └─ Define event schemas if needed                    │
│    └─ Version contracts package (e.g., v1.0.0)          │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 2. TEST INFRASTRUCTURE (test-harnesses/)                │
│    └─ Launch real browser (Chrome/Firefox/Safari)       │
│    └─ Start test app dev server (React/Vue/etc.)        │
│    └─ Start local services (Redis, etc.)                │
│    └─ Verify connections (CDP/RDP/WebKit)               │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 3. WRITE TEST (RED PHASE)                               │
│    └─ Import interface from contracts/                  │
│    └─ Write test using real browser instance            │
│    └─ Test FAILS (no implementation yet)                │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 4. IMPLEMENT (GREEN PHASE)                              │
│    └─ Implement interface in core/infrastructure/       │
│    └─ Use real browser via protocol adapter             │
│    └─ Test PASSES with real browser                     │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 5. REFACTOR (BLUE PHASE)                                │
│    └─ Optimize implementation                           │
│    └─ Improve performance (<100ms queries)              │
│    └─ Tests still pass                                  │
└─────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────┐
│ 6. INTEGRATION TEST                                     │
│    └─ Compose multiple interfaces via DI                │
│    └─ Test end-to-end flow (browser → MCP → AI)         │
│    └─ Real browser + real MCP server                    │
└─────────────────────────────────────────────────────────┘
```

### 4.2 Example TDD Workflow: Framework Detector

**Step 1: Interface First** (`contracts/business-logic/IFrameworkDetector.ts`):

```typescript
export interface IFrameworkDetector {
  detect(tabId: number, nodeId: number): Promise<FrameworkData | null>;
  detectAll(tabId: number): Promise<FrameworkData[]>;
}
```

**Step 2: Test Infrastructure** (`test-harnesses/setup.ts`):

```typescript
import { ChromeTestInstance } from './browser-instances/ChromeTestInstance';
import { DevServerManager } from './test-servers/DevServerManager';

export async function setupTestInfrastructure() {
  // Start test app dev server
  const serverManager = new DevServerManager();
  await serverManager.startApp('react-app', 3000);

  // Launch real Chrome browser
  const chrome = new ChromeTestInstance();
  await chrome.launch();
  await chrome.navigate('http://localhost:3000');

  // Enable CDP domains
  await chrome.sendCDPCommand('DOM.enable');
  await chrome.sendCDPCommand('Runtime.enable');

  return { chrome, serverManager };
}
```

**Step 3: Write Test (RED)** (`core/framework-detection/UniversalFrameworkDetector.test.ts`):

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { IFrameworkDetector } from '@browser-mcp/contracts/business-logic';
import { ChromeTestInstance } from '../../test-harnesses/browser-instances/ChromeTestInstance';
import { DevServerManager } from '../../test-harnesses/test-servers/DevServerManager';
import { UniversalFrameworkDetector } from './UniversalFrameworkDetector'; // Implementation (doesn't exist yet)
import { CDPAdapter } from '../../infrastructure/protocol-adapters/CDPAdapter';

describe('UniversalFrameworkDetector (Real Browser)', () => {
  let chrome: ChromeTestInstance;
  let serverManager: DevServerManager;
  let detector: IFrameworkDetector;
  let cdpAdapter: CDPAdapter;

  beforeAll(async () => {
    // Start React test app
    serverManager = new DevServerManager();
    await serverManager.startApp('react-app', 3000);

    // Launch real Chrome
    chrome = new ChromeTestInstance();
    await chrome.launch();
    await chrome.navigate('http://localhost:3000');

    // Create CDP adapter
    cdpAdapter = new CDPAdapter();
    await cdpAdapter.connect(1); // tabId = 1

    // Create detector with real CDP adapter
    detector = new UniversalFrameworkDetector(cdpAdapter);
  });

  afterAll(async () => {
    await chrome.close();
    serverManager.stopAll();
  });

  it('should detect React framework', async () => {
    // Get root DOM node
    const doc = await chrome.sendCDPCommand('DOM.getDocument');
    const rootNodeId = doc.root.nodeId;

    // Detect framework (RED PHASE - this will FAIL)
    const framework = await detector.detect(1, rootNodeId);

    expect(framework).not.toBeNull();
    expect(framework?.name).toBe('React');
    expect(framework?.version).toMatch(/^18\./); // React 18.x
  });

  it('should detect all frameworks in page', async () => {
    const frameworks = await detector.detectAll(1);

    expect(frameworks.length).toBeGreaterThan(0);
    expect(frameworks[0].name).toBe('React');
  });
});
```

**Run Test (RED)**: Test FAILS because `UniversalFrameworkDetector` doesn't exist yet.

```bash
npm test
# FAIL: Cannot find module './UniversalFrameworkDetector'
```

**Step 4: Implement (GREEN)** (`core/framework-detection/UniversalFrameworkDetector.ts`):

```typescript
import { IFrameworkDetector } from '@browser-mcp/contracts/business-logic';
import { ICDPAdapter } from '@browser-mcp/contracts/protocol-adapters';
import { FrameworkData } from '@browser-mcp/contracts/types/FrameworkTypes';

export class UniversalFrameworkDetector implements IFrameworkDetector {
  constructor(private cdpAdapter: ICDPAdapter) {}

  async detect(tabId: number, nodeId: number): Promise<FrameworkData | null> {
    // Check for React Fiber
    const result = await this.cdpAdapter.send(tabId, 'Runtime.evaluate', {
      expression: `
        (function() {
          const root = document.getElementById('root');
          if (!root) return null;

          // Check for React Fiber (React 16+)
          const fiberKey = Object.keys(root).find(key => key.startsWith('__reactFiber'));
          if (fiberKey) {
            const fiber = root[fiberKey];
            return {
              name: 'React',
              version: window.React?.version || null
            };
          }
          return null;
        })()
      `,
      returnByValue: true,
    });

    return result.result.value;
  }

  async detectAll(tabId: number): Promise<FrameworkData[]> {
    const framework = await this.detect(tabId, 0);
    return framework ? [framework] : [];
  }
}
```

**Run Test (GREEN)**: Test PASSES with real browser.

```bash
npm test
# PASS: UniversalFrameworkDetector (Real Browser)
#   ✓ should detect React framework (234ms)
#   ✓ should detect all frameworks in page (89ms)
```

**Step 5: Refactor (BLUE)** - Optimize detection logic, add caching, tests still pass.

**Step 6: Integration Test** - Test detector + DOM extractor + source mapper together.

---

## 5. Test Categories

### 5.1 Unit Tests (60% of tests)

**Scope**: Single interface implementation
**Browser**: Real browser instance (Puppeteer/Playwright)
**Speed**: 100-500ms per test (browser pooling)

**Example**:
```typescript
// Tests IFrameworkDetector implementation
describe('UniversalFrameworkDetector', () => {
  it('detects React', async () => { /* ... */ });
  it('detects Vue', async () => { /* ... */ });
  it('detects Blazor', async () => { /* ... */ });
});
```

### 5.2 Integration Tests (30% of tests)

**Scope**: Multiple interfaces composed
**Browser**: Real browser + real MCP server
**Speed**: 500ms-2s per test

**Example**:
```typescript
// Tests FrameworkDetector + DOMExtractor + SourceMapper together
describe('Component Inspection Integration', () => {
  it('maps React component to source file', async () => {
    const detector = container.resolve<IFrameworkDetector>('IFrameworkDetector');
    const domExtractor = container.resolve<IDOMExtractor>('IDOMExtractor');
    const sourceMapper = container.resolve<ISourceMapper>('ISourceMapper');

    // Detect framework
    const framework = await detector.detect(tabId, nodeId);
    expect(framework?.name).toBe('React');

    // Get DOM node
    const node = await domExtractor.getDOMNode(tabId, nodeId);

    // Map to source
    const sourceLocation = await sourceMapper.mapToSource(
      tabId,
      node.sourceLocation.file,
      node.sourceLocation.line,
      node.sourceLocation.column
    );

    expect(sourceLocation?.file).toMatch(/Button\.tsx$/);
  });
});
```

### 5.3 End-to-End Tests (10% of tests)

**Scope**: Full extension + AI assistant
**Browser**: Real browser with extension installed
**Speed**: 5-10s per test

**Example**:
```typescript
// Tests full extension flow
describe('Browser Extension E2E', () => {
  it('activates tab and exposes resources to AI', async () => {
    // 1. Install extension in browser
    const chrome = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    // 2. Navigate to test app
    const page = await chrome.newPage();
    await page.goto('http://localhost:3000');

    // 3. Click extension icon to activate tab
    // (simulate user interaction)

    // 4. Verify MCP server started
    const response = await fetch('http://localhost:3142/mcp/resources');
    expect(response.ok).toBe(true);

    // 5. Query resources
    const resources = await response.json();
    expect(resources).toContainEqual({
      uri: 'browser://tab-localhost-3000/console/errors',
    });
  });
});
```

---

## 6. Browser Test Instances

### 6.1 Browser Pooling for Speed

**Problem**: Launching browser for each test is slow (1-2s overhead).

**Solution**: Browser pool with pre-launched instances.

**BrowserPool.ts**:

```typescript
import { ChromeTestInstance } from './browser-instances/ChromeTestInstance';

/**
 * Pool of pre-launched Chrome instances for faster testing.
 */
export class BrowserPool {
  private pool: ChromeTestInstance[] = [];
  private available: ChromeTestInstance[] = [];
  private inUse = new Set<ChromeTestInstance>();

  /**
   * Initializes pool with N browsers.
   */
  async init(size: number): Promise<void> {
    for (let i = 0; i < size; i++) {
      const instance = new ChromeTestInstance();
      await instance.launch();
      this.pool.push(instance);
      this.available.push(instance);
    }
  }

  /**
   * Acquires a browser instance.
   */
  async acquire(): Promise<ChromeTestInstance> {
    if (this.available.length === 0) {
      // Pool exhausted - wait or create new
      throw new Error('Browser pool exhausted');
    }

    const instance = this.available.pop()!;
    this.inUse.add(instance);
    return instance;
  }

  /**
   * Releases a browser instance back to pool.
   */
  release(instance: ChromeTestInstance): void {
    this.inUse.delete(instance);
    this.available.push(instance);
  }

  /**
   * Closes all browsers in pool.
   */
  async closeAll(): Promise<void> {
    for (const instance of this.pool) {
      await instance.close();
    }
    this.pool = [];
    this.available = [];
    this.inUse.clear();
  }
}
```

**Usage in Tests**:

```typescript
import { beforeAll, afterAll } from 'vitest';
import { BrowserPool } from '../../test-harnesses/BrowserPool';

const browserPool = new BrowserPool();

beforeAll(async () => {
  await browserPool.init(5); // 5 pre-launched browsers
});

afterAll(async () => {
  await browserPool.closeAll();
});

it('runs test with pooled browser', async () => {
  const chrome = await browserPool.acquire();
  try {
    await chrome.navigate('http://localhost:3000');
    // ... test logic
  } finally {
    browserPool.release(chrome);
  }
});
```

---

## 7. Test App Templates

### 7.1 Test Apps for Framework Detection

Each test app is a minimal app using a specific framework:

```
test-harnesses/test-apps/
├── react-app/          # React 18 with Vite
│   ├── src/
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── vue-app/            # Vue 3 with Vite
├── blazor-app/         # Blazor WASM
├── svelte-app/         # Svelte with Vite
├── angular-app/        # Angular 17
├── solid-app/          # Solid.js
└── [11 more frameworks]
```

**Example React Test App** (`test-apps/react-app/src/App.tsx`):

```tsx
import { useState } from 'react';

export default function App() {
  const [count, setCount] = useState(0);

  return (
    <div id="root">
      <h1>React Test App</h1>
      <button data-testid="increment" onClick={() => setCount(count + 1)}>
        Count: {count}
      </button>
    </div>
  );
}
```

**package.json**:

```json
{
  "name": "react-test-app",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite --port 3000",
    "build": "vite build"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.0.0",
    "vite": "^5.0.0"
  }
}
```

---

## 8. Performance Testing

### 8.1 Sub-100ms Query Requirement

Per requirements, most MCP resource queries must complete in <100ms.

**Performance Test Example**:

```typescript
describe('Performance: DOM Extraction', () => {
  it('getDOMTree completes in <100ms', async () => {
    const domExtractor = container.resolve<IDOMExtractor>('IDOMExtractor');

    const start = performance.now();
    await domExtractor.getDOMTree(tabId);
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100);
  });

  it('queryDOM completes in <50ms (cached)', async () => {
    const domExtractor = container.resolve<IDOMExtractor>('IDOMExtractor');

    // Prime cache
    await domExtractor.queryDOM(tabId, '.button');

    // Measure cached query
    const start = performance.now();
    await domExtractor.queryDOM(tabId, '.button');
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(50);
  });
});
```

### 8.2 Load Testing

**Test with Large DOMs** (10k+ nodes):

```typescript
it('handles large DOM (10k nodes) in <200ms', async () => {
  // Navigate to stress test page
  await chrome.navigate('http://localhost:3000/stress-test-10k-nodes');

  const domExtractor = container.resolve<IDOMExtractor>('IDOMExtractor');

  const start = performance.now();
  const tree = await domExtractor.getDOMTree(tabId);
  const elapsed = performance.now() - start;

  expect(tree.nodeCount).toBeGreaterThan(10000);
  expect(elapsed).toBeLessThan(200);
});
```

---

## 9. CI/CD Integration

### 9.1 GitHub Actions Workflow

**.github/workflows/test.yml**:

```yaml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium firefox webkit

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### 9.2 Test Scripts

**package.json**:

```json
{
  "scripts": {
    "test": "vitest",
    "test:unit": "vitest run --testPathPattern=.unit.test.ts",
    "test:integration": "vitest run --testPathPattern=.integration.test.ts",
    "test:e2e": "playwright test",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## Summary

This TDD strategy enforces:

1. **Interface-First Development**: Define contracts before tests
2. **Real Implementations**: Use real browsers, real protocols (NO MOCKS)
3. **Test Infrastructure First**: Set up browsers/services before writing tests
4. **Red-Green-Refactor**: Strict TDD cycle
5. **Performance Validation**: Sub-100ms query tests
6. **CI/CD Integration**: Automated testing with real browsers

**Key Takeaway**: Even "unit tests" use **real Chrome/Firefox/Safari instances** via Puppeteer/Playwright. This catches real-world issues that mocks would hide.

---

**Next**: See [EXTENSION-DESIGN.md](../browser-extension/EXTENSION-DESIGN.md) for browser extension architecture.
