import { test, expect, chromium, BrowserContext } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn, ChildProcess } from 'child_process';

/**
 * End-to-End Connection Test
 *
 * This test verifies the complete connection flow:
 * 1. Starts the companion app (MCP server)
 * 2. Loads the extension in Chrome
 * 3. Connects a tab
 * 4. Verifies the connection works
 * 5. Cleans up
 */

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let context: BrowserContext;
let extensionId: string;
let companionApp: ChildProcess;

test.beforeAll(async () => {
  // Start companion app
  console.log('🚀 Starting companion app...');
  const rootDir = path.join(__dirname, '../..');

  companionApp = spawn('npm', ['run', 'companion'], {
    cwd: rootDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });

  // Wait for companion app to start
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Companion app failed to start'));
    }, 30000);

    companionApp.stdout?.on('data', (data) => {
      const output = data.toString();
      console.log('[Companion]', output);
      if (output.includes('All systems ready')) {
        clearTimeout(timeout);
        resolve();
      }
    });

    companionApp.stderr?.on('data', (data) => {
      console.error('[Companion Error]', data.toString());
    });
  });

  console.log('✅ Companion app started');

  // Wait a bit for the server to be fully ready
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Verify server is responding
  try {
    const response = await fetch('http://localhost:3100/health');
    const data = await response.json();
    console.log('✅ Health check passed:', data);
  } catch (err) {
    throw new Error('Companion app health check failed: ' + err);
  }

  // Load extension
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
  console.log('✅ Extension loaded with ID:', extensionId);
});

test.afterAll(async () => {
  await context?.close();

  // Stop companion app
  if (companionApp) {
    console.log('🛑 Stopping companion app...');
    companionApp.kill('SIGTERM');

    // Wait for graceful shutdown
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Force kill if still running
    if (!companionApp.killed) {
      companionApp.kill('SIGKILL');
    }
    console.log('✅ Companion app stopped');
  }
});

test.describe('E2E Connection Flow', () => {
  test('should complete full connection flow', async () => {
    // Step 1: Verify server is running
    const healthResponse = await fetch('http://localhost:3100/health');
    expect(healthResponse.ok).toBe(true);
    const healthData = await healthResponse.json();
    expect(healthData.status).toBe('ok');
    expect(healthData.server).toBe('running');

    // Step 2: Open a test page
    const page = await context.newPage();
    await page.goto('https://example.com');
    await page.waitForLoadState('networkidle');

    // Step 3: Open setup guide
    const setupPage = await context.newPage();
    await setupPage.goto(`chrome-extension://${extensionId}/popup/setup-guide.html`);

    // Step 4: Verify Step 1 shows server is ready
    await setupPage.waitForTimeout(4000); // Wait for health check to complete

    const step1Status = await setupPage.locator('#step1Status');
    const statusText = await step1Status.textContent();
    expect(statusText).toContain('Ready');

    // Step 5: Verify connect button is enabled
    const connectBtn = await setupPage.locator('#connectTabBtn');
    expect(await connectBtn.isEnabled()).toBe(true);

    // Step 6: Click connect button
    await connectBtn.click();

    // Step 7: Wait for connection to complete
    await setupPage.waitForTimeout(2000);

    // Step 8: Verify Step 2 is complete
    const step2Complete = await setupPage.locator('#step2Complete');
    expect(await step2Complete.isVisible()).toBe(true);

    const completionText = await step2Complete.textContent();
    expect(completionText).toContain('connected successfully');

    // Step 9: Verify port was allocated
    const portElement = await setupPage.locator('#allocatedPort');
    const port = await portElement.textContent();
    expect(port).toMatch(/^31\d{2}$/); // Should be 3100-3199

    console.log('✅ Connection successful! Port:', port);

    // Step 10: Verify "All Done" section is visible
    const allDone = await setupPage.locator('#allDone');
    expect(await allDone.isVisible()).toBe(true);

    // Step 11: Verify active connections in test-popup
    // Navigate to test-popup to see the list of active connections
    await setupPage.goto(`chrome-extension://${extensionId}/popup/test-popup.html`);
    await setupPage.waitForTimeout(1500);

    // Verify active connections list shows the tab
    const tabsList = await setupPage.locator('#activeTabsList');
    await setupPage.waitForTimeout(500); // Wait for list to update
    const tabsContent = await tabsList.textContent();
    expect(tabsContent).toContain('Tab');
    expect(tabsContent).toContain('Port');

    console.log('✅ Active connections verified');
    console.log('✅ Full E2E connection test passed!');

    // Cleanup
    await setupPage.close();
    await page.close();
  });

  test('should detect server not running when stopped', async () => {
    // This test verifies the extension properly detects when server is down
    // We'll temporarily stop the companion app for this test

    // Note: We skip this test in CI as it requires stopping/starting the server
    test.skip(process.env.CI === 'true', 'Skipping server stop test in CI');

    // Stop companion app temporarily
    companionApp.kill('SIGTERM');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Open setup guide
    const setupPage = await context.newPage();
    await setupPage.goto(`chrome-extension://${extensionId}/popup/setup-guide.html`);

    // Wait for health check
    await setupPage.waitForTimeout(4000);

    // Verify Step 1 shows server is not ready
    const step1Status = await setupPage.locator('#step1Status');
    const statusText = await step1Status.textContent();
    expect(statusText).toContain('Not Running');

    // Verify connect button is disabled
    const connectBtn = await setupPage.locator('#connectTabBtn');
    expect(await connectBtn.isEnabled()).toBe(false);

    await setupPage.close();

    // Restart companion app for other tests
    const rootDir = path.join(__dirname, '../..');
    companionApp = spawn('npm', ['run', 'companion'], {
      cwd: rootDir,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true
    });

    await new Promise(resolve => setTimeout(resolve, 5000));
  });
});
