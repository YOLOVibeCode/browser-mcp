import { IPortManager } from '@browser-mcp/contracts/mcp-server';
/**
 * Smart port allocation manager.
 * Handles port conflicts, allocation, and release for multi-tab support.
 */
export declare class PortManager implements IPortManager {
    private readonly DEFAULT_RANGE;
    private readonly FALLBACK_RANGE;
    private tabToPort;
    private portToTab;
    findAvailablePort(): Promise<number>;
    isPortAvailable(port: number): Promise<boolean>;
    reservePort(tabId: number, port: number): void;
    releasePort(tabId: number): void;
    getPortForTab(tabId: number): number | null;
    getTabForPort(port: number): number | null;
    getAllReservedPorts(): Map<number, number>;
}
//# sourceMappingURL=PortManager.d.ts.map