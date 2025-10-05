import type { ICDPAdapter } from '@browser-mcp/contracts/cdp';
import type { CDPSession } from 'playwright';
/**
 * Adapter for Chrome DevTools Protocol using Playwright's CDP session.
 * This is a REAL implementation that communicates with actual Chrome DevTools Protocol.
 * NO MOCKS - uses real CDP session from Playwright.
 */
export declare class CDPAdapter implements ICDPAdapter {
    private cdpSession;
    private connected;
    private enabledDomains;
    private eventHandlers;
    constructor(cdpSession: CDPSession);
    connect(wsUrl: string): Promise<void>;
    isConnected(): boolean;
    enableDomain(domain: string): Promise<void>;
    disableDomain(domain: string): Promise<void>;
    sendCommand<T = any>(method: string, params?: any): Promise<T>;
    on<T = any>(event: string, handler: (params: T) => void): () => void;
    off(event: string, handler: (params: any) => void): void;
    disconnect(): Promise<void>;
    getEnabledDomains(): string[];
}
//# sourceMappingURL=CDPAdapter.d.ts.map