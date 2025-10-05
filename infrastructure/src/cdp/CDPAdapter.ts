import type { ICDPAdapter } from '@browser-mcp/contracts/cdp';
import type { CDPSession } from 'playwright';

/**
 * Adapter for Chrome DevTools Protocol using Playwright's CDP session.
 * This is a REAL implementation that communicates with actual Chrome DevTools Protocol.
 * NO MOCKS - uses real CDP session from Playwright.
 */
export class CDPAdapter implements ICDPAdapter {
  private connected = false;
  private enabledDomains = new Set<string>();
  private eventHandlers = new Map<string, Set<(params: any) => void>>();

  constructor(private cdpSession: CDPSession) {}

  async connect(wsUrl: string): Promise<void> {
    // In this implementation, we're already connected via Playwright's CDP session
    // The wsUrl parameter is kept for interface compatibility
    this.connected = true;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async enableDomain(domain: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to CDP target');
    }

    await this.cdpSession.send(`${domain}.enable` as any);
    this.enabledDomains.add(domain);
  }

  async disableDomain(domain: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Not connected to CDP target');
    }

    await this.cdpSession.send(`${domain}.disable` as any);
    this.enabledDomains.delete(domain);
  }

  async sendCommand<T = any>(method: string, params?: any): Promise<T> {
    if (!this.connected) {
      throw new Error('Not connected to CDP target');
    }

    return this.cdpSession.send(method as any, params) as Promise<T>;
  }

  on<T = any>(event: string, handler: (params: T) => void): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());

      // Register with CDP session
      this.cdpSession.on(event as any, (params: any) => {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
          handlers.forEach((h) => h(params));
        }
      });
    }

    this.eventHandlers.get(event)!.add(handler as any);

    // Return unsubscribe function
    return () => {
      this.off(event, handler);
    };
  }

  off(event: string, handler: (params: any) => void): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.delete(handler);

      // If no more handlers, remove the event entirely
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
        // Note: We don't remove from CDP session as Playwright manages that
      }
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.enabledDomains.clear();
    this.eventHandlers.clear();
    // Note: We don't detach the CDP session as it's managed by Playwright
  }

  getEnabledDomains(): string[] {
    return Array.from(this.enabledDomains);
  }
}
