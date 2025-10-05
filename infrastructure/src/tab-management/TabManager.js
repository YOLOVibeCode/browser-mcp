/**
 * Manages active browser tabs and their virtual filesystems.
 * Uses event bus for loose coupling.
 */
export class TabManager {
    eventBus;
    // Map: tabId -> TabInfo
    activeTabs = new Map();
    constructor(eventBus) {
        this.eventBus = eventBus;
    }
    async activateTab(tabId, url, port) {
        const virtualFilesystemURI = this.generateVirtualFilesystemURI(url);
        const tabInfo = {
            tabId,
            url,
            title: '', // Will be populated later when we integrate with browser APIs
            port,
            framework: null, // Will be detected later
            isActive: true,
            virtualFilesystemURI,
            activatedAt: Date.now(),
        };
        this.activeTabs.set(tabId, tabInfo);
        // Emit TabActivated event
        const event = {
            tabId,
            url,
            port,
            timestamp: Date.now(),
        };
        this.eventBus.emit('TabActivated', event);
    }
    async deactivateTab(tabId) {
        const tabInfo = this.activeTabs.get(tabId);
        if (!tabInfo) {
            // Idempotent - no error if tab not active
            return;
        }
        this.activeTabs.delete(tabId);
        // Emit TabDeactivated event
        const event = {
            tabId,
            timestamp: Date.now(),
        };
        this.eventBus.emit('TabDeactivated', event);
    }
    getTabInfo(tabId) {
        return this.activeTabs.get(tabId) ?? null;
    }
    getAllActiveTabs() {
        return Array.from(this.activeTabs.values());
    }
    isTabActive(tabId) {
        return this.activeTabs.has(tabId);
    }
    getVirtualFilesystemURI(tabId) {
        const tabInfo = this.activeTabs.get(tabId);
        return tabInfo?.virtualFilesystemURI ?? null;
    }
    /**
     * Generates virtual filesystem URI from tab URL.
     * Example: http://localhost:3000 -> browser://tab-localhost-3000/
     * Example: https://example.com -> browser://tab-example-com/
     */
    generateVirtualFilesystemURI(url) {
        try {
            const urlObj = new URL(url);
            // Extract host (hostname:port)
            let host = urlObj.hostname;
            if (urlObj.port) {
                host += `-${urlObj.port}`;
            }
            // Replace dots and colons with hyphens for filesystem-safe name
            const safeName = host.replace(/\./g, '-').replace(/:/g, '-');
            return `browser://tab-${safeName}/`;
        }
        catch {
            // Fallback for invalid URLs
            const safeName = url.replace(/[^a-zA-Z0-9]/g, '-');
            return `browser://tab-${safeName}/`;
        }
    }
}
//# sourceMappingURL=TabManager.js.map