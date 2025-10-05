import type {
  IMCPTransport,
  JSONRPCMessage,
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCNotification,
} from '@browser-mcp/contracts/transport';
import { Readable, Writable } from 'stream';
import * as readline from 'readline';

/**
 * Stdio transport for MCP protocol.
 * Implements JSON-RPC 2.0 over stdin/stdout.
 * NO MOCKS - real stream communication.
 */
export class StdioTransport implements IMCPTransport {
  private requestHandler: ((request: JSONRPCRequest) => Promise<any>) | null = null;
  private notificationHandler: ((notification: JSONRPCNotification) => void) | null = null;
  private rl: readline.Interface | null = null;
  private running = false;

  constructor(
    private input: Readable = process.stdin,
    private output: Writable = process.stdout
  ) {}

  start(): void {
    if (this.running) return;

    this.running = true;
    this.rl = readline.createInterface({
      input: this.input,
      output: undefined, // Don't echo to output
      terminal: false,
    });

    this.rl.on('line', (line: string) => {
      this.handleIncomingMessage(line);
    });
  }

  async send(message: JSONRPCMessage): Promise<void> {
    const json = JSON.stringify(message);
    return new Promise((resolve, reject) => {
      this.output.write(json + '\n', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  onRequest(handler: (request: JSONRPCRequest) => Promise<any>): void {
    this.requestHandler = handler;
  }

  onNotification(handler: (notification: JSONRPCNotification) => void): void {
    this.notificationHandler = handler;
  }

  stop(): void {
    this.running = false;
    if (this.rl) {
      this.rl.close();
      this.rl = null;
    }
  }

  private async handleIncomingMessage(line: string): Promise<void> {
    if (!this.running) return;
    if (!line.trim()) return;

    try {
      const message = JSON.parse(line) as JSONRPCMessage;

      // Check if it's a request (has id and method)
      if ('id' in message && 'method' in message) {
        await this.handleRequest(message as JSONRPCRequest);
      }
      // Check if it's a notification (has method but no id)
      else if ('method' in message && !('id' in message)) {
        this.handleNotification(message as JSONRPCNotification);
      }
      // Otherwise it might be a response (has id and result/error)
      // We don't handle responses in the server, only send them
    } catch (error) {
      // Invalid JSON or parsing error - ignore
      console.error('Failed to parse message:', error);
    }
  }

  private async handleRequest(request: JSONRPCRequest): Promise<void> {
    if (!this.requestHandler) {
      // No handler registered, send error
      await this.send({
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32601,
          message: 'Method not found',
        },
      });
      return;
    }

    try {
      const result = await this.requestHandler(request);

      const response: JSONRPCResponse = {
        jsonrpc: '2.0',
        id: request.id,
        result,
      };

      await this.send(response);
    } catch (error: any) {
      const response: JSONRPCResponse = {
        jsonrpc: '2.0',
        id: request.id,
        error: {
          code: -32603,
          message: error.message || 'Internal error',
          data: error.stack,
        },
      };

      await this.send(response);
    }
  }

  private handleNotification(notification: JSONRPCNotification): void {
    if (this.notificationHandler) {
      this.notificationHandler(notification);
    }
  }
}
