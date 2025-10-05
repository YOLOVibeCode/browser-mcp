import { TabInfo } from '../types/MCPTypes';
/**
 * Manages active browser tabs and their virtual filesystems.
 */
export interface ITabManager {
    /**
     * Activates debugging for a tab.
     * @param tabId - Browser tab ID
     * @param url - Tab URL (used for virtual filesystem mount point)
     * @param port - MCP server port for this tab
     * @emits TabActivated event
     */
    activateTab(tabId: number, url: string, port: number): Promise<void>;
    /**
     * Deactivates debugging for a tab.
     * @param tabId - Browser tab ID
     * @emits TabDeactivated event
     */
    deactivateTab(tabId: number): Promise<void>;
    /**
     * Gets information about an active tab.
     * @param tabId - Browser tab ID
     * @returns Tab info or null if not active
     */
    getTabInfo(tabId: number): TabInfo | null;
    /**
     * Gets all active tabs.
     * @returns Array of active tab info
     */
    getAllActiveTabs(): TabInfo[];
    /**
     * Checks if a tab is active.
     */
    isTabActive(tabId: number): boolean;
    /**
     * Gets virtual filesystem URI for a tab.
     * Example: browser://tab-localhost-3000/
     */
    getVirtualFilesystemURI(tabId: number): string | null;
}
/**
 * Custom errors for tab management
 */
export declare class TabNotActiveError extends Error {
    constructor(tabId: number);
}
export declare class TabAlreadyActiveError extends Error {
    constructor(tabId: number);
}
//# sourceMappingURL=ITabManager.d.ts.map