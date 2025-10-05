import type { IVirtualFilesystemProvider } from '@browser-mcp/contracts/virtual-fs';
import type { MCPResourceProvider } from '@browser-mcp/contracts/mcp-server';
/**
 * Virtual filesystem provider for browser tabs.
 * Maps browser state to virtual URIs.
 * NO MOCKS - real data storage.
 */
export declare class VirtualFilesystemProvider implements IVirtualFilesystemProvider {
    private tabData;
    getBaseURI(url: string): string;
    createResourcesForTab(tabId: number, url: string): MCPResourceProvider[];
    setDOMContent(tabId: number, content: string): void;
    setConsoleLogs(tabId: number, logs: any[]): void;
    setNetworkRequests(tabId: number, requests: any[]): void;
    setFrameworks(tabId: number, frameworks: any[]): void;
    clearTab(tabId: number): void;
}
//# sourceMappingURL=VirtualFilesystemProvider.d.ts.map