import { ITabManager } from '@browser-mcp/contracts/mcp-server';
import { IEventBus } from '@browser-mcp/contracts/events';
import { TabInfo } from '@browser-mcp/contracts/types';
/**
 * Manages active browser tabs and their virtual filesystems.
 * Uses event bus for loose coupling.
 */
export declare class TabManager implements ITabManager {
    private eventBus;
    private activeTabs;
    constructor(eventBus: IEventBus);
    activateTab(tabId: number, url: string, port: number): Promise<void>;
    deactivateTab(tabId: number): Promise<void>;
    getTabInfo(tabId: number): TabInfo | null;
    getAllActiveTabs(): TabInfo[];
    isTabActive(tabId: number): boolean;
    getVirtualFilesystemURI(tabId: number): string | null;
    /**
     * Generates virtual filesystem URI from tab URL.
     * Example: http://localhost:3000 -> browser://tab-localhost-3000/
     * Example: https://example.com -> browser://tab-example-com/
     */
    private generateVirtualFilesystemURI;
}
//# sourceMappingURL=TabManager.d.ts.map