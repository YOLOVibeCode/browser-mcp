import type { IMCPTransport, JSONRPCMessage, JSONRPCRequest, JSONRPCNotification } from '@browser-mcp/contracts/transport';
import { Readable, Writable } from 'stream';
/**
 * Stdio transport for MCP protocol.
 * Implements JSON-RPC 2.0 over stdin/stdout.
 * NO MOCKS - real stream communication.
 */
export declare class StdioTransport implements IMCPTransport {
    private input;
    private output;
    private requestHandler;
    private notificationHandler;
    private rl;
    private running;
    constructor(input?: Readable, output?: Writable);
    start(): void;
    send(message: JSONRPCMessage): Promise<void>;
    onRequest(handler: (request: JSONRPCRequest) => Promise<any>): void;
    onNotification(handler: (notification: JSONRPCNotification) => void): void;
    stop(): void;
    private handleIncomingMessage;
    private handleRequest;
    private handleNotification;
}
//# sourceMappingURL=StdioTransport.d.ts.map