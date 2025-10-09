# Testing Guide for Browser MCP

This project uses a **two-layer testing approach**:

1. **Unit Tests** - Fast, mocked Chrome APIs
2. **E2E Tests** - Real Chrome browser with actual extension loaded

## Quick Start

```bash
# Install Playwright (one-time)
npm install

# Install Chromium browser for Playwright (one-time)
npx playwright install chromium

# Run all tests (unit + E2E)
npm test

# Run only unit tests (fast)
npm run test:unit

# Run only E2E tests (real Chrome)
npm run test:e2e

# Run E2E with visible browser (for debugging)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

## Test Structure

```
browser-mcp-extension/tests/
├── *.test.js              # Unit tests (mocked Chrome APIs)
├── *.e2e.spec.js          # E2E tests (real Chrome browser)
├── run-all-tests.js       # Unit test runner
└── extension-real.e2e.spec.js  # Main E2E test suite
```

## Unit Tests (Current - Mocked)

**Pros:**
- ⚡ Fast execution (milliseconds)
- ✅ No browser required
- ✅ Good for TDD
- ✅ Test individual components

**Cons:**
- ❌ Doesn't test real Chrome APIs
- ❌ Misses security context issues
- ❌ Can't test WebSocket server

**Files:**
- `tab-manager.test.js`
- `chrome-cdp.test.js`
- `mcp-server.test.js`
- `message-filter.test.js`
- `delta-compression.test.js`

## E2E Tests (NEW - Real Chrome)

**Pros:**
- ✅ Tests actual extension in Chrome
- ✅ Real Chrome APIs (debugger, tabs, etc.)
- ✅ Tests WebSocket server
- ✅ Catches security/permission issues
- ✅ Tests full user workflow

**Cons:**
- ⏱️ Slower (seconds per test)
- 🖥️ Requires display (headless: false)
- 💾 More resource intensive

**What it tests:**
- Extension loads in Chrome
- Service worker initializes
- WebSocket server starts
- Chrome DevTools Protocol (CDP) access
- Tab management across multiple pages
- Console log capture
- Full tool execution flow

## Writing E2E Tests

Playwright **does NOT automatically load extensions**. You must configure it:

```javascript
import { chromium } from '@playwright/test';
import path from 'path';

// Load extension explicitly
const context = await chromium.launchPersistentContext('', {
  headless: false, // REQUIRED for extensions
  args: [
    `--disable-extensions-except=${extensionPath}`,
    `--load-extension=${extensionPath}`,
  ],
});

// Get extension ID from service worker
const [serviceWorker] = context.serviceWorkers();
const extensionId = serviceWorker.url().split('/')[2];

// Now test your extension
const page = await context.newPage();
await page.goto(`chrome-extension://${extensionId}/popup/popup.html`);
```

## Extension Testing Limitations

Chrome extensions have special requirements:

1. **Must run in headed mode** - `headless: false` required
2. **Extension ID is dynamic** - Extract from service worker URL
3. **Async initialization** - Wait for service worker ready
4. **Permissions matter** - Test in real browser context
5. **Single worker** - Extensions can conflict, run tests sequentially

## Playwright Configuration

See `playwright.config.js` for settings:

```javascript
{
  headless: false,        // Extensions require visible browser
  workers: 1,             // Run tests sequentially
  timeout: 30000,         // 30s per test
  screenshot: 'on-failure' // Debug artifacts
}
```

## CI/CD Considerations

For automated testing in CI:

```bash
# GitHub Actions example
- name: Install Playwright
  run: npx playwright install --with-deps chromium

# Run with Xvfb (virtual display on Linux)
- name: Run E2E Tests
  run: xvfb-run npm run test:e2e
```

## Testing Checklist

When adding new features, test:

- [ ] Unit test with mocked Chrome API
- [ ] E2E test with real Chrome
- [ ] Multiple tab scenarios
- [ ] Error handling
- [ ] WebSocket connectivity
- [ ] MCP tool execution
- [ ] CDP commands work

## Debugging Failed Tests

```bash
# Run with visible browser
npm run test:e2e:headed

# Step through test execution
npm run test:e2e:debug

# Check screenshots in test-results/
ls test-results/

# View HTML report
npx playwright show-report
```

## Known Issues

1. **Extension ID changes** - Dynamic per load, extract programmatically
2. **Service worker delays** - Add `setTimeout` after initialization
3. **WebSocket timing** - May not start immediately on first load
4. **Tab tracking** - TabManager needs time to register new tabs

## Best Practices

1. **Always use real Chrome for E2E** - Mocks miss critical issues
2. **Keep unit tests fast** - Use for TDD and component testing
3. **Run E2E before releases** - Catches integration problems
4. **Test WebSocket separately** - May need local MCP server running
5. **Clean up resources** - Close pages/contexts after tests
6. **Use meaningful assertions** - Not just "truthy", check actual values

## Example: Testing MCP Tool Flow

```javascript
test('Full listTabs tool workflow', async () => {
  // 1. Open multiple tabs
  const page1 = await context.newPage();
  await page1.goto('https://example.com');
  
  const page2 = await context.newPage();
  await page2.goto('https://google.com');
  
  // 2. Send MCP request to service worker
  const result = await serviceWorker.evaluate(async () => {
    const response = await mcpServer.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name: 'listTabs', arguments: {} }
    });
    return response;
  });
  
  // 3. Verify response
  expect(result.result.totalCount).toBe(2);
  expect(result.result.tabs[0].url).toContain('example.com');
  
  // 4. Cleanup
  await page1.close();
  await page2.close();
});
```

## Questions?

See the official docs:
- [Playwright for Chrome Extensions](https://playwright.dev/docs/chrome-extensions)
- [Chrome Extension Testing](https://developer.chrome.com/docs/extensions/mv3/testing/)

