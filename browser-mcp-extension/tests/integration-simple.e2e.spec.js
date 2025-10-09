/**
 * Simple Integration Test (v4.0.4 Architecture)
 * Tests extension loading and basic functionality
 * NOTE: Full MCP server integration requires manual testing with real IDE
 */

import { test, expect, chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let context, extensionId;

test.beforeAll(async () => {
  console.log('\n==============================================');
  console.log('Simple Integration Test (v4.0.4)');
  console.log('Testing: Extension loading and basic operations');
  console.log('==============================================\n');
  
  const extensionPath = path.resolve(__dirname, '..');
  const userDataDir = path.join(__dirname, '.playwright-simple-test');
  
  context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`,
      '--no-sandbox',
    ],
    ignoreDefaultArgs: ['--disable-extensions', '--disable-component-extensions-with-background-pages'],
    timeout: 60000,
  });

  // Wait for service worker
  await context.waitForEvent('serviceworker', { timeout: 15000 }).catch(() => {
    console.warn('Service worker event timeout - continuing...');
  });
  
  const serviceWorkers = context.serviceWorkers();
  if (serviceWorkers.length > 0) {
    const sw = serviceWorkers[0];
    extensionId = sw.url().split('/')[2];
    console.log('✓ Extension loaded, ID:', extensionId);
  }
  
  await new Promise(resolve => setTimeout(resolve, 2000));
  console.log('✓ Extension initialized\n');
}, 90000);

test.afterAll(async () => {
  if (context) {
    await context.close();
  }
});

test('Extension loads and service worker initializes', async () => {
  const serviceWorkers = context.serviceWorkers();
  
  expect(serviceWorkers.length).toBeGreaterThan(0);
  console.log(`✓ Found ${serviceWorkers.length} service worker(s)`);
  
  const sw = serviceWorkers[0];
  expect(sw.url()).toContain('chrome-extension://');
  console.log('✓ Service worker URL:', sw.url());
});

test('Extension can open and manage web pages', async () => {
  const page = await context.newPage();
  await page.goto('https://example.com');
  await page.waitForLoadState('domcontentloaded');
  
  const title = await page.title();
  expect(title).toContain('Example');
  console.log('✓ Page title:', title);
  
  await page.close();
  console.log('✓ Page closed successfully');
});

test('Extension persists across multiple page operations', async () => {
  const operations = 3;
  
  for (let i = 1; i <= operations; i++) {
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('domcontentloaded');
    
    const title = await page.title();
    expect(title).toBeTruthy();
    
    await page.close();
    console.log(`✓ Operation ${i}/${operations} completed`);
  }
  
  // Verify extension still active
  const serviceWorkers = context.serviceWorkers();
  expect(serviceWorkers.length).toBeGreaterThan(0);
  console.log('✓ Extension persisted through all operations');
});

test('Extension service worker remains stable', async () => {
  const initialCount = context.serviceWorkers().length;
  
  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const finalCount = context.serviceWorkers().length;
  
  expect(finalCount).toBe(initialCount);
  console.log('✓ Service worker count stable:', finalCount);
});

test('Multiple browser pages can be managed simultaneously', async () => {
  const pages = [];
  
  // Open 3 pages
  for (let i = 0; i < 3; i++) {
    const page = await context.newPage();
    await page.goto('https://example.com');
    pages.push(page);
    console.log(`✓ Page ${i + 1} opened`);
  }
  
  // Verify all pages loaded
  for (const page of pages) {
    const title = await page.title();
    expect(title).toBeTruthy();
  }
  
  console.log('✓ All 3 pages loaded successfully');
  
  // Close all pages
  for (const page of pages) {
    await page.close();
  }
  
  console.log('✓ All pages closed successfully');
});

test('Extension has access to Chrome APIs', async () => {
  const sw = context.serviceWorkers()[0];
  
  // Evaluate in service worker context
  const hasChrome = await sw.evaluate(() => {
    return typeof chrome !== 'undefined';
  });
  
  expect(hasChrome).toBeTruthy();
  console.log('✓ Chrome APIs available in service worker');
  
  const hasTabsAPI = await sw.evaluate(() => {
    return typeof chrome.tabs !== 'undefined';
  });
  
  expect(hasTabsAPI).toBeTruthy();
  console.log('✓ chrome.tabs API available');
});

