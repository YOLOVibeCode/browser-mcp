import type { MCPResourceProvider } from '../mcp-server/IMCPServer';
/**
 * Virtual filesystem provider for browser tab resources.
 * Maps browser state to virtual URIs like:
 * - browser://tab-{host}/dom/html
 * - browser://tab-{host}/console/logs
 * - browser://tab-{host}/network/requests
 * - browser://tab-{host}/metadata/frameworks
 */
export interface IVirtualFilesystemProvider {
    /**
     * Create resource providers for a tab
     */
    createResourcesForTab(tabId: number, url: string): MCPResourceProvider[];
    /**
     * Get base URI for a tab
     */
    getBaseURI(url: string): string;
    /**
     * Set DOM content provider for a tab
     */
    setDOMContent(tabId: number, content: string): void;
    /**
     * Set console logs provider for a tab
     */
    setConsoleLogs(tabId: number, logs: any[]): void;
    /**
     * Set network requests provider for a tab
     */
    setNetworkRequests(tabId: number, requests: any[]): void;
    /**
     * Set detected frameworks for a tab
     */
    setFrameworks(tabId: number, frameworks: any[]): void;
    /**
     * Clear all data for a tab
     */
    clearTab(tabId: number): void;
}
//# sourceMappingURL=IVirtualFilesystemProvider.d.ts.map