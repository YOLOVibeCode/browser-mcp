import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Use happy-dom for browser extension tests
    environmentMatchGlobs: [
      ['extension-chromium/**/*.test.ts', 'happy-dom'],
    ],
  },
  resolve: {
    alias: {
      '@browser-mcp/contracts': resolve(__dirname, './contracts/src'),
      '@browser-mcp/contracts/events': resolve(__dirname, './contracts/src/events'),
      '@browser-mcp/contracts/mcp-server': resolve(__dirname, './contracts/src/mcp-server'),
      '@browser-mcp/contracts/types': resolve(__dirname, './contracts/src/types'),
    },
  },
});
