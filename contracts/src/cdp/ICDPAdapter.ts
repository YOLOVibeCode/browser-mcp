export interface CDPDomain {
  name: string;
  version: string;
}

export interface CDPResponse<T = any> {
  id: number;
  result: T;
  error?: {
    code: number;
    message: string;
  };
}

export interface CDPEvent<T = any> {
  method: string;
  params: T;
}

/**
 * Adapter for Chrome DevTools Protocol communication.
 * Provides low-level access to browser debugging capabilities.
 */
export interface ICDPAdapter {
  /**
   * Connect to a Chrome DevTools Protocol target.
   * @param wsUrl WebSocket URL for CDP connection (e.g., ws://localhost:9222/devtools/page/...)
   */
  connect(wsUrl: string): Promise<void>;

  /**
   * Check if connected to CDP target.
   */
  isConnected(): boolean;

  /**
   * Enable a CDP domain (e.g., 'Runtime', 'DOM', 'Network', 'Console').
   */
  enableDomain(domain: string): Promise<void>;

  /**
   * Disable a CDP domain.
   */
  disableDomain(domain: string): Promise<void>;

  /**
   * Send a CDP command and wait for response.
   */
  sendCommand<T = any>(method: string, params?: any): Promise<T>;

  /**
   * Subscribe to CDP events.
   * @returns Unsubscribe function
   */
  on<T = any>(event: string, handler: (params: T) => void): () => void;

  /**
   * Unsubscribe from CDP events.
   */
  off(event: string, handler: (params: any) => void): void;

  /**
   * Disconnect from CDP target.
   */
  disconnect(): Promise<void>;

  /**
   * Get list of enabled domains.
   */
  getEnabledDomains(): string[];
}
