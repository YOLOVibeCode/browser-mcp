/**
 * Browser-compatible Port Manager
 * Uses simple tracking instead of actual port binding
 * (Port binding will happen when MCP server starts)
 */

import { IPortManager, NoAvailablePortError, PortAlreadyReservedError } from '../../contracts/src/mcp-server/IPortManager';

/**
 * Browser-compatible implementation of IPortManager.
 * Instead of actually binding ports, we track allocated ports
 * and assume they're available (actual binding happens when MCP server starts).
 */
export class BrowserPortManager implements IPortManager {
  private readonly DEFAULT_RANGE: [number, number] = [3100, 3199];
  private readonly FALLBACK_RANGE: [number, number] = [3200, 3299];

  // Maps: tabId -> port
  private tabToPort = new Map<number, number>();
  // Reverse map: port -> tabId
  private portToTab = new Map<number, number>();
  // Track which ports we've allocated (to avoid duplicates)
  private allocatedPorts = new Set<number>();

  async findAvailablePort(): Promise<number> {
    // Try default range first (3100-3199)
    for (let port = this.DEFAULT_RANGE[0]; port <= this.DEFAULT_RANGE[1]; port++) {
      if (!this.allocatedPorts.has(port) && !this.portToTab.has(port)) {
        return port;
      }
    }

    // Fallback to higher range (3200-3299)
    for (let port = this.FALLBACK_RANGE[0]; port <= this.FALLBACK_RANGE[1]; port++) {
      if (!this.allocatedPorts.has(port) && !this.portToTab.has(port)) {
        return port;
      }
    }

    throw new NoAvailablePortError();
  }

  async isPortAvailable(port: number): Promise<boolean> {
    // Check if port is already reserved internally
    return !this.portToTab.has(port) && !this.allocatedPorts.has(port);
  }

  reservePort(tabId: number, port: number): void {
    // Check if port is already reserved by another tab
    const existingTabId = this.portToTab.get(port);
    if (existingTabId !== undefined && existingTabId !== tabId) {
      throw new PortAlreadyReservedError(port);
    }

    // Release old port if tab is updating its reservation
    const oldPort = this.tabToPort.get(tabId);
    if (oldPort !== undefined && oldPort !== port) {
      this.portToTab.delete(oldPort);
      this.allocatedPorts.delete(oldPort);
    }

    // Reserve port
    this.tabToPort.set(tabId, port);
    this.portToTab.set(port, tabId);
    this.allocatedPorts.add(port);
  }

  releasePort(tabId: number): void {
    const port = this.tabToPort.get(tabId);
    if (port !== undefined) {
      this.tabToPort.delete(tabId);
      this.portToTab.delete(port);
      this.allocatedPorts.delete(port);
    }
  }

  getPortForTab(tabId: number): number | null {
    return this.tabToPort.get(tabId) ?? null;
  }

  getTabForPort(port: number): number | null {
    return this.portToTab.get(port) ?? null;
  }

  getAllReservedPorts(): Map<number, number> {
    return new Map(this.tabToPort);
  }
}
