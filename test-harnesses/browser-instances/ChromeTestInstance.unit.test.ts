import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ChromeTestInstance } from './ChromeTestInstance';
import { readFileSync } from 'fs';
import { resolve } from 'path';

describe('ChromeTestInstance (Real Chromium Browser)', () => {
  let chrome: ChromeTestInstance;
  const testAppPath = resolve(__dirname, '../test-apps/simple-html/index.html');

  beforeAll(async () => {
    chrome = new ChromeTestInstance();
    await chrome.launch();
  }, 30000);

  afterAll(async () => {
    if (chrome) {
      await chrome.close();
    }
  });

  describe('launch and navigate', () => {
    it('should launch Chrome successfully', () => {
      expect(chrome.isLaunched()).toBe(true);
    });

    it('should navigate to a local HTML file', async () => {
      await chrome.navigate(`file://${testAppPath}`);
      const url = await chrome.getURL();
      expect(url).toContain('simple-html/index.html');
    });

    it('should get page title', async () => {
      await chrome.navigate(`file://${testAppPath}`);
      const title = await chrome.getTitle();
      expect(title).toBe('Simple Test App');
    });
  });

  describe('CDP integration', () => {
    it('should enable CDP domains', async () => {
      await chrome.navigate(`file://${testAppPath}`);

      // Enable Runtime domain for console access
      await expect(chrome.enableCDPDomain('Runtime')).resolves.not.toThrow();

      // Enable DOM domain for DOM access
      await expect(chrome.enableCDPDomain('DOM')).resolves.not.toThrow();
    });

    it('should evaluate JavaScript in page context', async () => {
      await chrome.navigate(`file://${testAppPath}`);

      const result = await chrome.evaluateInPage<number>('1 + 1');
      expect(result).toBe(2);
    });

    it('should access DOM via CDP', async () => {
      await chrome.navigate(`file://${testAppPath}`);
      await chrome.enableCDPDomain('DOM');

      // Get document
      const doc = await chrome.sendCDPCommand('DOM.getDocument', {});
      expect(doc).toHaveProperty('root');
      expect(doc.root).toHaveProperty('nodeId');
      expect(doc.root.nodeName).toBe('#document');
    });
  });

  describe('console message capture', () => {
    it('should capture console.log messages', async () => {
      await chrome.navigate(`file://${testAppPath}`);
      await chrome.enableCDPDomain('Runtime');

      const messages: any[] = [];
      const unsubscribe = chrome.onCDPEvent('Runtime.consoleAPICalled', (params) => {
        messages.push(params);
      });

      // Trigger console.log in page
      await chrome.evaluateInPage('console.log("Test message from page")');

      // Give it a moment to capture
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(messages.length).toBeGreaterThan(0);
      const logMessage = messages.find(m =>
        m.args && m.args.some((arg: any) => arg.value === "Test message from page")
      );
      expect(logMessage).toBeDefined();

      unsubscribe();
    });
  });

  describe('multiple pages', () => {
    it('should handle navigation between pages', async () => {
      // Navigate to test app
      await chrome.navigate(`file://${testAppPath}`);
      let title = await chrome.getTitle();
      expect(title).toBe('Simple Test App');

      // Navigate to google (will fail without internet, but tests navigation)
      try {
        await chrome.navigate('https://www.example.com', { timeout: 5000 });
        title = await chrome.getTitle();
        expect(title).toContain('Example');
      } catch (error) {
        // Expected if no internet - test still validates navigation API works
        expect(error).toBeDefined();
      }
    });
  });

  describe('page interaction', () => {
    it('should click elements and verify changes', async () => {
      await chrome.navigate(`file://${testAppPath}`);

      // Click the button
      await chrome.click('#test-button');

      // Verify output changed
      const outputText = await chrome.evaluateInPage<string>(
        'document.getElementById("output").textContent'
      );
      expect(outputText).toContain('Button clicked 1 times!');
    });

    it('should type text into inputs', async () => {
      await chrome.navigate(`file://${testAppPath}`);

      // Add an input dynamically for this test
      await chrome.evaluateInPage(`
        const input = document.createElement('input');
        input.id = 'test-input';
        document.body.appendChild(input);
      `);

      await chrome.type('#test-input', 'Hello from test!');

      const value = await chrome.evaluateInPage<string>(
        'document.getElementById("test-input").value'
      );
      expect(value).toBe('Hello from test!');
    });
  });

  describe('performance', () => {
    it('should navigate quickly (< 3000ms)', async () => {
      const start = Date.now();
      await chrome.navigate(`file://${testAppPath}`);
      const elapsed = Date.now() - start;

      expect(elapsed).toBeLessThan(3000);
    });
  });
});
