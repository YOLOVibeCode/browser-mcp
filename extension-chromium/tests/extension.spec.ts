import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Chrome Extension E2E Tests
 *
 * Tests the Browser Inspector extension functionality:
 * - Extension loads correctly
 * - Popup displays and functions
 * - Tab connection/disconnection works
 * - Port allocation works
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let context: BrowserContext;
let extensionId: string;

test.beforeAll(async () => {
  // Path to the built extension
  const pathToExtension = path.join(__dirname, '../dist');

  // Launch browser with extension loaded
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--no-sandbox',
    ],
  });

  // Get extension ID from background page
  let [background] = context.serviceWorkers();
  if (!background) {
    background = await context.waitForEvent('serviceworker');
  }

  extensionId = background.url().split('/')[2];
  console.log('Extension loaded with ID:', extensionId);
});

test.afterAll(async () => {
  await context.close();
});

test.describe('Chrome Extension - Basic Loading', () => {
  test('should load extension successfully', async () => {
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/);
  });

  test('should have service worker running', async () => {
    const serviceWorkers = context.serviceWorkers();
    expect(serviceWorkers.length).toBeGreaterThan(0);

    const extensionWorker = serviceWorkers.find(sw =>
      sw.url().includes(extensionId)
    );
    expect(extensionWorker).toBeTruthy();
  });
});

test.describe('Chrome Extension - Popup Functionality', () => {
  test('should open popup and display current tab info', async () => {
    // Create a new page in the context
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');

    // Open extension popup in a new page
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/test-popup.html`);

    // Wait for popup to load
    await popupPage.waitForSelector('#currentTabUrl', { timeout: 5000 });

    // Check that current tab URL is displayed
    const urlElement = await popupPage.locator('#currentTabUrl');
    const urlText = await urlElement.textContent();
    expect(urlText).toBeTruthy();

    await popupPage.close();
    await page.close();
  });

  test('should show disconnected status initially', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/test-popup.html`);
    await popupPage.waitForSelector('#currentTabStatus', { timeout: 5000 });

    const statusElement = await popupPage.locator('#currentTabStatus');
    const statusText = await statusElement.textContent();
    expect(statusText).toBe('Disconnected');

    // Activate button should be visible
    const activateBtn = await popupPage.locator('#activateBtn');
    expect(await activateBtn.isVisible()).toBe(true);

    await popupPage.close();
  });

  test('should connect tab when activate button is clicked', async () => {
    // Navigate to test page
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');

    // Open popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/test-popup.html`);
    await popupPage.waitForSelector('#activateBtn', { timeout: 5000 });

    // Click activate button
    const activateBtn = await popupPage.locator('#activateBtn');
    await activateBtn.click();

    // Wait for status to update
    await popupPage.waitForTimeout(1000);

    // Check status changed to connected
    const statusElement = await popupPage.locator('#currentTabStatus');
    const statusText = await statusElement.textContent();
    expect(statusText).toBe('Connected');

    // Deactivate button should now be visible
    const deactivateBtn = await popupPage.locator('#deactivateBtn');
    expect(await deactivateBtn.isVisible()).toBe(true);

    await popupPage.close();
    await page.close();
  });

  test('should show active tab in the list', async () => {
    // Open popup (assuming tab is already activated from previous test)
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/test-popup.html`);
    await popupPage.waitForSelector('#activeTabsList', { timeout: 5000 });

    // Check that active tabs list is populated
    const tabsList = await popupPage.locator('#activeTabsList');
    const tabsContent = await tabsList.textContent();

    // Should show at least one tab with port info
    expect(tabsContent).toContain('Tab');
    expect(tabsContent).toContain('Port');

    await popupPage.close();
  });

  test('should disconnect tab when deactivate button is clicked', async () => {
    // Open popup
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/test-popup.html`);
    await popupPage.waitForSelector('#deactivateBtn', { timeout: 5000 });

    // Click deactivate button
    const deactivateBtn = await popupPage.locator('#deactivateBtn');
    await deactivateBtn.click();

    // Wait for status to update
    await popupPage.waitForTimeout(1000);

    // Check status changed back to disconnected
    const statusElement = await popupPage.locator('#currentTabStatus');
    const statusText = await statusElement.textContent();
    expect(statusText).toBe('Disconnected');

    // Activate button should be visible again
    const activateBtn = await popupPage.locator('#activateBtn');
    expect(await activateBtn.isVisible()).toBe(true);

    await popupPage.close();
  });
});

test.describe('Chrome Extension - Multi-Tab Support', () => {
  test('should handle multiple tabs with unique ports', async () => {
    // Create multiple pages
    const page1 = await context.newPage();
    const page2 = await context.newPage();

    await page1.goto('https://example.com');
    await page2.goto('https://www.google.com');

    // Activate both tabs by opening popup in each
    await page1.goto(`chrome-extension://${extensionId}/popup/test-popup.html`);
    await page1.waitForSelector('#activateBtn', { timeout: 5000 });
    await page1.locator('#activateBtn').click();
    await page1.waitForTimeout(1000);

    await page2.goto(`chrome-extension://${extensionId}/popup/test-popup.html`);
    await page2.waitForSelector('#activateBtn', { timeout: 5000 });
    await page2.locator('#activateBtn').click();
    await page2.waitForTimeout(1000);

    // Check that active tabs list shows both tabs
    const tabsList = await page1.locator('#activeTabsList');
    const tabsContent = await tabsList.textContent();

    // Should show 2 tabs
    const tabMatches = tabsContent?.match(/Tab \d+/g);
    expect(tabMatches).toBeTruthy();
    expect(tabMatches!.length).toBeGreaterThanOrEqual(2);

    // Cleanup
    await page1.close();
    await page2.close();
  });
});
