import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CDPAdapter } from './CDPAdapter';
import { chromium, Browser, Page, CDPSession } from 'playwright';

describe('CDPAdapter', () => {
  let browser: Browser;
  let page: Page;
  let cdpSession: CDPSession;
  let adapter: CDPAdapter;

  beforeEach(async () => {
    // Launch real browser for CDP testing
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    page = await context.newPage();
    cdpSession = await context.newCDPSession(page);

    adapter = new CDPAdapter(cdpSession);
  });

  afterEach(async () => {
    await adapter.disconnect();
    await browser.close();
  });

  describe('connect', () => {
    it('should mark adapter as connected', async () => {
      await adapter.connect('mock-ws-url');

      expect(adapter.isConnected()).toBe(true);
    });
  });

  describe('isConnected', () => {
    it('should return false initially', () => {
      const freshAdapter = new CDPAdapter(cdpSession);

      expect(freshAdapter.isConnected()).toBe(false);
    });

    it('should return true after connect', async () => {
      await adapter.connect('mock-ws-url');

      expect(adapter.isConnected()).toBe(true);
    });

    it('should return false after disconnect', async () => {
      await adapter.connect('mock-ws-url');
      await adapter.disconnect();

      expect(adapter.isConnected()).toBe(false);
    });
  });

  describe('enableDomain', () => {
    it('should enable Runtime domain', async () => {
      await adapter.connect('mock-ws-url');

      await adapter.enableDomain('Runtime');

      expect(adapter.getEnabledDomains()).toContain('Runtime');
    });

    it('should enable multiple domains', async () => {
      await adapter.connect('mock-ws-url');

      await adapter.enableDomain('Runtime');
      await adapter.enableDomain('Console');
      await adapter.enableDomain('Network');

      const domains = adapter.getEnabledDomains();
      expect(domains).toContain('Runtime');
      expect(domains).toContain('Console');
      expect(domains).toContain('Network');
    });
  });

  describe('disableDomain', () => {
    it('should disable an enabled domain', async () => {
      await adapter.connect('mock-ws-url');
      await adapter.enableDomain('Runtime');

      await adapter.disableDomain('Runtime');

      expect(adapter.getEnabledDomains()).not.toContain('Runtime');
    });
  });

  describe('sendCommand', () => {
    it('should send Runtime.evaluate command', async () => {
      await adapter.connect('mock-ws-url');
      await adapter.enableDomain('Runtime');

      const result = await adapter.sendCommand('Runtime.evaluate', {
        expression: '2 + 2',
      });

      expect(result).toBeDefined();
      expect(result.result).toBeDefined();
      expect(result.result.value).toBe(4);
    });

    it('should send DOM.getDocument command', async () => {
      await adapter.connect('mock-ws-url');
      await adapter.enableDomain('DOM');

      // Navigate to a page first
      await page.goto('data:text/html,<html><body>Test</body></html>');

      const result = await adapter.sendCommand('DOM.getDocument');

      expect(result).toBeDefined();
      expect(result.root).toBeDefined();
      expect(result.root.nodeName).toBe('#document');
    });
  });

  describe('on/off', () => {
    it('should subscribe to Console.messageAdded events', async () => {
      await adapter.connect('mock-ws-url');
      await adapter.enableDomain('Console');

      const messages: any[] = [];
      const unsubscribe = adapter.on('Console.messageAdded', (params) => {
        messages.push(params);
      });

      // Trigger console message
      await page.evaluate(() => console.log('Test message'));

      // Wait for event
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(messages.length).toBeGreaterThan(0);

      unsubscribe();
    });

    it('should unsubscribe from events', async () => {
      await adapter.connect('mock-ws-url');
      await adapter.enableDomain('Console');

      const messages: any[] = [];
      const handler = (params: any) => {
        messages.push(params);
      };

      adapter.on('Console.messageAdded', handler);

      // Trigger first message
      await page.evaluate(() => console.log('Message 1'));
      await new Promise((resolve) => setTimeout(resolve, 500));

      const countAfterFirst = messages.length;

      // Unsubscribe
      adapter.off('Console.messageAdded', handler);

      // Trigger second message
      await page.evaluate(() => console.log('Message 2'));
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should not have increased
      expect(messages.length).toBe(countAfterFirst);
    });

    it('should return unsubscribe function', async () => {
      await adapter.connect('mock-ws-url');
      await adapter.enableDomain('Console');

      const messages: any[] = [];
      const unsubscribe = adapter.on('Console.messageAdded', (params) => {
        messages.push(params);
      });

      // Trigger first message
      await page.evaluate(() => console.log('Message 1'));
      await new Promise((resolve) => setTimeout(resolve, 500));

      const countAfterFirst = messages.length;

      // Unsubscribe via returned function
      unsubscribe();

      // Trigger second message
      await page.evaluate(() => console.log('Message 2'));
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Should not have increased
      expect(messages.length).toBe(countAfterFirst);
    });
  });

  describe('getEnabledDomains', () => {
    it('should return empty array initially', () => {
      expect(adapter.getEnabledDomains()).toEqual([]);
    });

    it('should return list of enabled domains', async () => {
      await adapter.connect('mock-ws-url');
      await adapter.enableDomain('Runtime');
      await adapter.enableDomain('DOM');

      const domains = adapter.getEnabledDomains();

      expect(domains).toHaveLength(2);
      expect(domains).toContain('Runtime');
      expect(domains).toContain('DOM');
    });
  });

  describe('disconnect', () => {
    it('should disconnect and clear enabled domains', async () => {
      await adapter.connect('mock-ws-url');
      await adapter.enableDomain('Runtime');

      await adapter.disconnect();

      expect(adapter.isConnected()).toBe(false);
      expect(adapter.getEnabledDomains()).toEqual([]);
    });
  });
});
