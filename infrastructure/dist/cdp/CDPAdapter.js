/**
 * Adapter for Chrome DevTools Protocol using Playwright's CDP session.
 * This is a REAL implementation that communicates with actual Chrome DevTools Protocol.
 * NO MOCKS - uses real CDP session from Playwright.
 */
export class CDPAdapter {
    cdpSession;
    connected = false;
    enabledDomains = new Set();
    eventHandlers = new Map();
    constructor(cdpSession) {
        this.cdpSession = cdpSession;
    }
    async connect(wsUrl) {
        // In this implementation, we're already connected via Playwright's CDP session
        // The wsUrl parameter is kept for interface compatibility
        this.connected = true;
    }
    isConnected() {
        return this.connected;
    }
    async enableDomain(domain) {
        if (!this.connected) {
            throw new Error('Not connected to CDP target');
        }
        await this.cdpSession.send(`${domain}.enable`);
        this.enabledDomains.add(domain);
    }
    async disableDomain(domain) {
        if (!this.connected) {
            throw new Error('Not connected to CDP target');
        }
        await this.cdpSession.send(`${domain}.disable`);
        this.enabledDomains.delete(domain);
    }
    async sendCommand(method, params) {
        if (!this.connected) {
            throw new Error('Not connected to CDP target');
        }
        return this.cdpSession.send(method, params);
    }
    on(event, handler) {
        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
            // Register with CDP session
            this.cdpSession.on(event, (params) => {
                const handlers = this.eventHandlers.get(event);
                if (handlers) {
                    handlers.forEach((h) => h(params));
                }
            });
        }
        this.eventHandlers.get(event).add(handler);
        // Return unsubscribe function
        return () => {
            this.off(event, handler);
        };
    }
    off(event, handler) {
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
    async disconnect() {
        this.connected = false;
        this.enabledDomains.clear();
        this.eventHandlers.clear();
        // Note: We don't detach the CDP session as it's managed by Playwright
    }
    getEnabledDomains() {
        return Array.from(this.enabledDomains);
    }
}
//# sourceMappingURL=CDPAdapter.js.map