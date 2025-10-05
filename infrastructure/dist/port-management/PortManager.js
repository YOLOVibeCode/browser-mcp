import { NoAvailablePortError, PortAlreadyReservedError, } from '@browser-mcp/contracts/mcp-server';
import { createServer } from 'net';
/**
 * Smart port allocation manager.
 * Handles port conflicts, allocation, and release for multi-tab support.
 */
export class PortManager {
    DEFAULT_RANGE = [3100, 3199];
    FALLBACK_RANGE = [3200, 3299];
    // Maps: tabId -> port
    tabToPort = new Map();
    // Reverse map: port -> tabId
    portToTab = new Map();
    async findAvailablePort() {
        // Try default range first (3100-3199)
        for (let port = this.DEFAULT_RANGE[0]; port <= this.DEFAULT_RANGE[1]; port++) {
            if (!this.portToTab.has(port) && (await this.isPortAvailable(port))) {
                return port;
            }
        }
        // Fallback to higher range (3200-3299)
        for (let port = this.FALLBACK_RANGE[0]; port <= this.FALLBACK_RANGE[1]; port++) {
            if (!this.portToTab.has(port) && (await this.isPortAvailable(port))) {
                return port;
            }
        }
        throw new NoAvailablePortError();
    }
    async isPortAvailable(port) {
        // Check if port is already reserved internally
        if (this.portToTab.has(port)) {
            return false;
        }
        // Try to bind to port to check OS-level availability
        return new Promise((resolve) => {
            const server = createServer();
            server.once('error', (err) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(false); // Port in use
                }
                else {
                    resolve(false); // Other error, assume unavailable
                }
            });
            server.once('listening', () => {
                server.close(() => {
                    resolve(true); // Port available
                });
            });
            server.listen(port, '127.0.0.1');
        });
    }
    reservePort(tabId, port) {
        // Check if port is already reserved by another tab
        const existingTabId = this.portToTab.get(port);
        if (existingTabId !== undefined && existingTabId !== tabId) {
            throw new PortAlreadyReservedError(port);
        }
        // Release old port if tab is updating its reservation
        const oldPort = this.tabToPort.get(tabId);
        if (oldPort !== undefined && oldPort !== port) {
            this.portToTab.delete(oldPort);
        }
        // Reserve port
        this.tabToPort.set(tabId, port);
        this.portToTab.set(port, tabId);
    }
    releasePort(tabId) {
        const port = this.tabToPort.get(tabId);
        if (port !== undefined) {
            this.tabToPort.delete(tabId);
            this.portToTab.delete(port);
        }
    }
    getPortForTab(tabId) {
        return this.tabToPort.get(tabId) ?? null;
    }
    getTabForPort(port) {
        return this.portToTab.get(port) ?? null;
    }
    getAllReservedPorts() {
        return new Map(this.tabToPort);
    }
}
//# sourceMappingURL=PortManager.js.map