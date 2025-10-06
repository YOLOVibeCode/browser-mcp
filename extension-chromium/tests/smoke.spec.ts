import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

/**
 * Chrome Extension Smoke Tests
 *
 * Basic smoke tests to verify extension loads and displays correctly
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let context: BrowserContext;
let extensionId: string;

test.beforeAll(async () => {
  const pathToExtension = path.join(__dirname, '../dist');

  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--no-sandbox',
    ],
  });

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

test.describe('Smoke Tests', () => {
  test('extension loads successfully', async () => {
    expect(extensionId).toBeTruthy();
    expect(extensionId).toMatch(/^[a-z]{32}$/);
  });

  test('service worker is running', async () => {
    const serviceWorkers = context.serviceWorkers();
    expect(serviceWorkers.length).toBeGreaterThan(0);

    const extensionWorker = serviceWorkers.find(sw =>
      sw.url().includes(extensionId)
    );
    expect(extensionWorker).toBeTruthy();
  });

  test('popup loads and displays UI elements', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/test-popup.html`);

    // Check all required UI elements exist
    await expect(popupPage.locator('#currentTabUrl')).toBeVisible();
    await expect(popupPage.locator('#currentTabStatus')).toBeVisible();
    await expect(popupPage.locator('#activateBtn')).toBeVisible();
    await expect(popupPage.locator('#activeTabsList')).toBeVisible();

    await popupPage.close();
  });

  test('popup shows disconnected status by default', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/test-popup.html`);

    const statusElement = await popupPage.locator('#currentTabStatus');
    const statusText = await statusElement.textContent();
    expect(statusText).toBe('Disconnected');

    await popupPage.close();
  });

  test('popup displays current tab URL', async () => {
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');

    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/test-popup.html`);

    await popupPage.waitForTimeout(500); // Wait for tab info to load

    const urlElement = await popupPage.locator('#currentTabUrl');
    const urlText = await urlElement.textContent();
    expect(urlText).toBeTruthy();

    await popupPage.close();
    await page.close();
  });

  test('activate button is clickable', async () => {
    const popupPage = await context.newPage();
    await popupPage.goto(`chrome-extension://${extensionId}/popup/test-popup.html`);

    const activateBtn = await popupPage.locator('#activateBtn');
    expect(await activateBtn.isEnabled()).toBe(true);

    // Click it to verify it doesn't crash
    await activateBtn.click();
    await popupPage.waitForTimeout(500);

    // Verify page is still responsive
    await expect(popupPage.locator('#currentTabStatus')).toBeVisible();

    await popupPage.close();
  });
});
