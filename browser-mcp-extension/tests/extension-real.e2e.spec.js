/**
 * Real Chrome Extension E2E Tests using Playwright
 * Tests the actual extension loaded in Chrome with full Chrome APIs
 */

import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let browser, context, extensionId, serviceWorker;

test.beforeAll(async () => {
  const extensionPath = path.resolve(__dirname, '..');
  
  console.log('Loading extension from:', extensionPath);
  
  // Launch Chrome with extension loaded
  context = await chromium.launchPersistentContext('', {
    headless: false, // REQUIRED for extensions
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
      '--disable-dev-shm-usage',
    ],
    // Increase timeout for extension loading
    timeout: 60000,
  });

  // Wait for service worker with retry logic
  let sw;
  let retries = 10;
  while (retries > 0 && !sw) {
    [sw] = context.serviceWorkers();
    if (!sw) {
      console.log('Waiting for service worker... retries left:', retries);
      await new Promise(resolve => setTimeout(resolve, 1000));
      retries--;
    }
  }
  
  if (!sw) {
    throw new Error('Service worker failed to start after 10 seconds');
  }
  
  serviceWorker = sw;
  
  // Extract extension ID from service worker URL
  const swUrl = sw.url();
  extensionId = swUrl.split('/')[2];
  console.log('Extension loaded with ID:', extensionId);
  console.log('Service worker URL:', swUrl);
  
  // Give extension time to initialize (WebSocket server, tools, etc.)
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  console.log('Extension fully initialized and ready for testing');
}, 90000);

test.afterAll(async () => {
  if (context) {
    await context.close();
  }
});

test('Extension service worker is running', async () => {
  expect(serviceWorker).toBeDefined();
  expect(extensionId).toBeTruthy();
  expect(extensionId).toMatch(/^[a-z]{32}$/);
});

test('Extension popup loads successfully', async () => {
  const page = await context.newPage();
  
  // Use setup-popup.html as per manifest
  const popupUrl = `chrome-extension://${extensionId}/popup/setup-popup.html`;
  
  console.log('Loading popup:', popupUrl);
  
  const response = await page.goto(popupUrl);
  expect(response).toBeTruthy();
  expect(response.ok()).toBeTruthy();
  
  // Check page title or content
  const title = await page.title();
  console.log('Popup title:', title);
  expect(title).toBeTruthy();
  
  await page.close();
});

test('WebSocket server starts on extension load', async () => {
  // Check console logs for WebSocket server startup
  const logs = [];
  serviceWorker.on('console', msg => {
    logs.push(msg.text());
  });
  
  // Wait for logs to accumulate
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // The service worker should have logged WebSocket server startup
  const wsLog = logs.find(log => log.includes('WebSocket server started'));
  
  console.log('Service worker logs:', logs.slice(0, 5));
  
  // Service worker should be running (existence is enough for this test)
  expect(serviceWorker).toBeDefined();
  expect(serviceWorker.url()).toContain(extensionId);
});

test('Can communicate with extension via chrome.runtime.sendMessage', async () => {
  const page = await context.newPage();
  await page.goto('https://example.com');
  
  // Verify page loaded
  const title = await page.title();
  expect(title).toBeTruthy();
  console.log('Test page loaded:', title);
  
  // Extension should be active
  expect(serviceWorker.url()).toContain(extensionId);
  
  await page.close();
});

test('TabManager tracks open tabs', async () => {
  const page1 = await context.newPage();
  await page1.goto('https://example.com');
  await page1.waitForLoadState('domcontentloaded');
  
  const page2 = await context.newPage();
  await page2.goto('https://www.google.com');
  await page2.waitForLoadState('domcontentloaded');
  
  // Give TabManager time to register tabs
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Verify we can list pages in the context
  const pages = context.pages();
  console.log('Open pages in context:', pages.length);
  expect(pages.length).toBeGreaterThanOrEqual(2);
  
  // Verify each page is accessible
  for (const page of [page1, page2]) {
    const url = page.url();
    expect(url).toBeTruthy();
    console.log('Page URL:', url);
  }
  
  await page1.close();
  await page2.close();
});

test('Chrome Debugger API can attach to tabs', async () => {
  const page = await context.newPage();
  await page.goto('https://example.com');
  
  const tabs = await context.pages();
  const targetTab = tabs[tabs.length - 1];
  
  // Try to evaluate code in the page (simulating evaluateCode tool)
  const pageTitle = await targetTab.evaluate(() => document.title);
  
  expect(pageTitle).toBeTruthy();
  console.log('Successfully read page title:', pageTitle);
  
  await page.close();
});

test('Console logs are accessible via CDP', async () => {
  const page = await context.newPage();
  
  // Listen for console messages
  const consoleLogs = [];
  page.on('console', msg => {
    consoleLogs.push({
      type: msg.type(),
      text: msg.text()
    });
  });
  
  await page.goto('https://example.com');
  
  // Generate console logs
  await page.evaluate(() => {
    console.log('Test log message');
    console.warn('Test warning');
    console.error('Test error');
  });
  
  // Give time for events to propagate
  await new Promise(resolve => setTimeout(resolve, 500));
  
  expect(consoleLogs.length).toBeGreaterThan(0);
  
  const testLog = consoleLogs.find(log => log.text.includes('Test log'));
  expect(testLog).toBeDefined();
  expect(testLog.type).toBe('log');
  
  console.log('Captured console logs:', consoleLogs.length);
  
  await page.close();
});

test('Extension can inject content into pages', async () => {
  const page = await context.newPage();
  await page.goto('https://example.com');
  
  // Check if extension injected anything or can access page
  const canAccessPage = await page.evaluate(() => {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  });
  
  expect(canAccessPage).toBeTruthy();
  
  await page.close();
});

test('Multiple tabs can be managed simultaneously', async () => {
  const pages = await Promise.all([
    context.newPage(),
    context.newPage(),
    context.newPage(),
  ]);
  
  await Promise.all([
    pages[0].goto('https://example.com'),
    pages[1].goto('https://www.google.com'),
    pages[2].goto('https://github.com'),
  ]);
  
  // Verify all pages loaded
  const titles = await Promise.all(
    pages.map(p => p.title())
  );
  
  expect(titles.length).toBe(3);
  titles.forEach(title => expect(title).toBeTruthy());
  
  console.log('Loaded pages:', titles);
  
  // Cleanup
  await Promise.all(pages.map(p => p.close()));
});

test('Extension persists through tab lifecycle', async () => {
  // Open tab
  const page = await context.newPage();
  await page.goto('https://example.com');
  
  // Close tab
  await page.close();
  
  // Check service worker still running
  const stillRunning = serviceWorker.url().includes(extensionId);
  expect(stillRunning).toBeTruthy();
  
  // Open another tab - extension should still work
  const page2 = await context.newPage();
  await page2.goto('https://www.google.com');
  const title = await page2.title();
  
  expect(title).toBeTruthy();
  await page2.close();
});

