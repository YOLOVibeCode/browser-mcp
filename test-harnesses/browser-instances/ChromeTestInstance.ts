import { chromium, Browser, Page, BrowserContext, CDPSession } from 'playwright';

/**
 * Chrome test instance using Playwright.
 * Provides access to real Chromium browser with CDP (Chrome DevTools Protocol).
 * NO MOCKS - this is a real browser instance for testing.
 */
export class ChromeTestInstance {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private cdpSession: CDPSession | null = null;

  /**
   * Launches Chromium browser.
   */
  async launch(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true, // Run headless for CI/CD
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    });

    this.context = await this.browser.newContext({
      viewport: { width: 1280, height: 720 },
    });

    this.page = await this.context.newPage();

    // Create CDP session for low-level access
    const client = await this.context.newCDPSession(this.page);
    this.cdpSession = client;
  }

  /**
   * Checks if browser is launched.
   */
  isLaunched(): boolean {
    return this.browser !== null && this.page !== null;
  }

  /**
   * Navigates to a URL.
   */
  async navigate(url: string, options?: { timeout?: number }): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.goto(url, {
      waitUntil: 'networkidle',
      timeout: options?.timeout ?? 30000,
    });
  }

  /**
   * Gets current URL.
   */
  async getURL(): Promise<string> {
    if (!this.page) throw new Error('Browser not launched');
    return this.page.url();
  }

  /**
   * Gets page title.
   */
  async getTitle(): Promise<string> {
    if (!this.page) throw new Error('Browser not launched');
    return this.page.title();
  }

  /**
   * Enables a CDP domain.
   * Common domains: Runtime, DOM, CSS, Network, Console
   */
  async enableCDPDomain(domain: string): Promise<void> {
    if (!this.cdpSession) throw new Error('CDP session not created');
    await this.cdpSession.send(`${domain}.enable` as any);
  }

  /**
   * Sends a CDP command.
   */
  async sendCDPCommand<T = any>(method: string, params?: any): Promise<T> {
    if (!this.cdpSession) throw new Error('CDP session not created');
    return this.cdpSession.send(method as any, params) as Promise<T>;
  }

  /**
   * Subscribes to CDP events.
   * @returns Unsubscribe function
   */
  onCDPEvent(event: string, handler: (params: any) => void): () => void {
    if (!this.cdpSession) throw new Error('CDP session not created');

    this.cdpSession.on(event as any, handler);

    // Return unsubscribe function
    return () => {
      if (this.cdpSession) {
        this.cdpSession.off(event as any, handler);
      }
    };
  }

  /**
   * Evaluates JavaScript in page context.
   */
  async evaluateInPage<T = any>(script: string | (() => T)): Promise<T> {
    if (!this.page) throw new Error('Browser not launched');
    return this.page.evaluate(script as any) as Promise<T>;
  }

  /**
   * Clicks an element by selector.
   */
  async click(selector: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.click(selector);
  }

  /**
   * Types text into an input element.
   */
  async type(selector: string, text: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.fill(selector, text);
  }

  /**
   * Waits for a selector to appear.
   */
  async waitForSelector(selector: string, options?: { timeout?: number }): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.waitForSelector(selector, {
      timeout: options?.timeout ?? 30000,
    });
  }

  /**
   * Takes a screenshot.
   */
  async screenshot(path: string): Promise<void> {
    if (!this.page) throw new Error('Browser not launched');
    await this.page.screenshot({ path });
  }

  /**
   * Gets the Playwright page instance (for advanced usage).
   */
  getPage(): Page {
    if (!this.page) throw new Error('Browser not launched');
    return this.page;
  }

  /**
   * Gets the CDP session (for advanced usage).
   */
  getCDPSession(): CDPSession {
    if (!this.cdpSession) throw new Error('CDP session not created');
    return this.cdpSession;
  }

  /**
   * Closes the browser.
   */
  async close(): Promise<void> {
    if (this.page) {
      await this.page.close();
      this.page = null;
    }
    if (this.context) {
      await this.context.close();
      this.context = null;
    }
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
    this.cdpSession = null;
  }
}
