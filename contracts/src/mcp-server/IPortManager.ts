/**
 * Smart port allocation manager.
 * Handles port conflicts, allocation, and release for multi-tab support.
 */
export interface IPortManager {
  /**
   * Finds an available port in the configured range.
   * Default range: 3100-3199
   * Fallback range: 3200-3299
   * @returns Available port number
   * @throws {NoAvailablePortError} if no ports available
   */
  findAvailablePort(): Promise<number>;

  /**
   * Checks if a specific port is available.
   * @param port - Port number to check
   * @returns true if available, false otherwise
   */
  isPortAvailable(port: number): Promise<boolean>;

  /**
   * Reserves a port for a tab.
   * @param tabId - Browser tab ID
   * @param port - Port number
   * @throws {PortAlreadyReservedError} if port already reserved
   */
  reservePort(tabId: number, port: number): void;

  /**
   * Releases a port from a tab.
   * @param tabId - Browser tab ID
   */
  releasePort(tabId: number): void;

  /**
   * Gets the port reserved for a tab.
   * @param tabId - Browser tab ID
   * @returns Port number or null if not reserved
   */
  getPortForTab(tabId: number): number | null;

  /**
   * Gets the tab ID for a reserved port.
   * @param port - Port number
   * @returns Tab ID or null if port not reserved
   */
  getTabForPort(port: number): number | null;

  /**
   * Gets all reserved ports with their tab IDs.
   * @returns Map of tabId -> port
   */
  getAllReservedPorts(): Map<number, number>;
}

/**
 * Custom errors for port management
 */
export class NoAvailablePortError extends Error {
  constructor(message = 'No available ports in range 3100-3299') {
    super(message);
    this.name = 'NoAvailablePortError';
  }
}

export class PortAlreadyReservedError extends Error {
  constructor(port: number) {
    super(`Port ${port} is already reserved`);
    this.name = 'PortAlreadyReservedError';
  }
}
