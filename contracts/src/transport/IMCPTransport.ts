/**
 * JSON-RPC 2.0 message types for MCP protocol
 */

export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id: string | number;
  method: string;
  params?: any;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: JSONRPCError;
}

export interface JSONRPCNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

export type JSONRPCMessage = JSONRPCRequest | JSONRPCResponse | JSONRPCNotification;

/**
 * MCP Transport interface for stdio communication
 */
export interface IMCPTransport {
  /**
   * Start listening for incoming messages
   */
  start(): void;

  /**
   * Send a JSON-RPC message
   */
  send(message: JSONRPCMessage): Promise<void>;

  /**
   * Register handler for incoming requests
   */
  onRequest(handler: (request: JSONRPCRequest) => Promise<any>): void;

  /**
   * Register handler for incoming notifications
   */
  onNotification(handler: (notification: JSONRPCNotification) => void): void;

  /**
   * Stop the transport
   */
  stop(): void;
}
