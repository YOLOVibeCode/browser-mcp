import * as readline from 'readline';
/**
 * Stdio transport for MCP protocol.
 * Implements JSON-RPC 2.0 over stdin/stdout.
 * NO MOCKS - real stream communication.
 */
export class StdioTransport {
    input;
    output;
    requestHandler = null;
    notificationHandler = null;
    rl = null;
    running = false;
    constructor(input = process.stdin, output = process.stdout) {
        this.input = input;
        this.output = output;
    }
    start() {
        if (this.running)
            return;
        this.running = true;
        this.rl = readline.createInterface({
            input: this.input,
            output: undefined, // Don't echo to output
            terminal: false,
        });
        this.rl.on('line', (line) => {
            this.handleIncomingMessage(line);
        });
    }
    async send(message) {
        const json = JSON.stringify(message);
        return new Promise((resolve, reject) => {
            this.output.write(json + '\n', (err) => {
                if (err)
                    reject(err);
                else
                    resolve();
            });
        });
    }
    onRequest(handler) {
        this.requestHandler = handler;
    }
    onNotification(handler) {
        this.notificationHandler = handler;
    }
    stop() {
        this.running = false;
        if (this.rl) {
            this.rl.close();
            this.rl = null;
        }
    }
    async handleIncomingMessage(line) {
        if (!this.running)
            return;
        if (!line.trim())
            return;
        try {
            const message = JSON.parse(line);
            // Check if it's a request (has id and method)
            if ('id' in message && 'method' in message) {
                await this.handleRequest(message);
            }
            // Check if it's a notification (has method but no id)
            else if ('method' in message && !('id' in message)) {
                this.handleNotification(message);
            }
            // Otherwise it might be a response (has id and result/error)
            // We don't handle responses in the server, only send them
        }
        catch (error) {
            // Invalid JSON or parsing error - ignore
            console.error('Failed to parse message:', error);
        }
    }
    async handleRequest(request) {
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
            const response = {
                jsonrpc: '2.0',
                id: request.id,
                result,
            };
            await this.send(response);
        }
        catch (error) {
            const response = {
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
    handleNotification(notification) {
        if (this.notificationHandler) {
            this.notificationHandler(notification);
        }
    }
}
//# sourceMappingURL=StdioTransport.js.map