/**
 * Playwright Configuration for Chrome Extension Testing
 * @see https://playwright.dev/docs/test-configuration
 */

export default {
  testDir: './browser-mcp-extension/tests',
  testMatch: '**/*.e2e.spec.js',
  timeout: 60000, // Increased for integration tests
  
  use: {
    headless: false, // Extensions require headed mode
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  // Run tests in sequence (extensions can conflict)
  workers: 1,
  
  reporter: [
    ['list'],
    ['html', { open: 'never' }]
  ],

  projects: [
    {
      name: 'chrome-extension',
      use: {
        channel: 'chrome',
      },
    },
  ],
};

