import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright configuration for Chrome extension testing
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Extensions need to be loaded sequentially
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Run tests serially for extension testing
  reporter: 'html',
  timeout: 30000,

  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium-extension',
      use: {
        ...devices['Desktop Chrome'],
        // Point to the built extension
        headless: false, // Extension testing requires headed mode
      },
    },
  ],
});
