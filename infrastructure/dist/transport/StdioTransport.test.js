import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StdioTransport } from './StdioTransport';
import { Readable, Writable } from 'stream';
describe('StdioTransport', () => {
    let transport;
    let mockInput;
    let mockOutput;
    let outputData;
    beforeEach(() => {
        // Create mock streams
        mockInput = new Readable({
            read() { },
        });
        outputData = [];
        mockOutput = new Writable({
            write(chunk, encoding, callback) {
                outputData.push(chunk.toString());
                callback();
            },
        });
        transport = new StdioTransport(mockInput, mockOutput);
    });
    afterEach(() => {
        transport.stop();
    });
    describe('send', () => {
        it('should send JSON-RPC request', async () => {
            await transport.send({
                jsonrpc: '2.0',
                id: 1,
                method: 'test',
            });
            expect(outputData.length).toBe(1);
            const message = JSON.parse(outputData[0]);
            expect(message.jsonrpc).toBe('2.0');
            expect(message.id).toBe(1);
            expect(message.method).toBe('test');
        });
        it('should send JSON-RPC response', async () => {
            await transport.send({
                jsonrpc: '2.0',
                id: 1,
                result: { success: true },
            });
            expect(outputData.length).toBe(1);
            const message = JSON.parse(outputData[0]);
            expect(message.jsonrpc).toBe('2.0');
            expect(message.id).toBe(1);
            expect(message.result.success).toBe(true);
        });
        it('should send JSON-RPC notification', async () => {
            await transport.send({
                jsonrpc: '2.0',
                method: 'notification',
                params: { data: 'test' },
            });
            expect(outputData.length).toBe(1);
            const message = JSON.parse(outputData[0]);
            expect(message.jsonrpc).toBe('2.0');
            expect(message.method).toBe('notification');
            expect(message.params.data).toBe('test');
        });
    });
    describe('onRequest', () => {
        it('should handle incoming requests', async () => {
            const handler = vi.fn().mockResolvedValue({ result: 'success' });
            transport.onRequest(handler);
            transport.start();
            // Simulate incoming request
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'test',
                params: { data: 'hello' },
            };
            mockInput.push(JSON.stringify(request) + '\n');
            // Wait for processing
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(handler).toHaveBeenCalledWith(request);
            // Should send response
            expect(outputData.length).toBeGreaterThan(0);
            const response = JSON.parse(outputData[outputData.length - 1]);
            expect(response.id).toBe(1);
            expect(response.result.result).toBe('success');
        });
        it('should handle request errors', async () => {
            const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
            transport.onRequest(handler);
            transport.start();
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'test',
            };
            mockInput.push(JSON.stringify(request) + '\n');
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(handler).toHaveBeenCalled();
            // Should send error response
            const response = JSON.parse(outputData[outputData.length - 1]);
            expect(response.id).toBe(1);
            expect(response.error).toBeDefined();
            expect(response.error.message).toContain('Handler error');
        });
    });
    describe('onNotification', () => {
        it('should handle incoming notifications', async () => {
            const handler = vi.fn();
            transport.onNotification(handler);
            transport.start();
            const notification = {
                jsonrpc: '2.0',
                method: 'notify',
                params: { message: 'hello' },
            };
            mockInput.push(JSON.stringify(notification) + '\n');
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(handler).toHaveBeenCalledWith(notification);
            // Should not send response for notifications
            expect(outputData.length).toBe(0);
        });
    });
    describe('message parsing', () => {
        it('should handle multiple messages on separate lines', async () => {
            const handler = vi.fn();
            transport.onNotification(handler);
            transport.start();
            const message1 = { jsonrpc: '2.0', method: 'test1' };
            const message2 = { jsonrpc: '2.0', method: 'test2' };
            mockInput.push(JSON.stringify(message1) + '\n');
            mockInput.push(JSON.stringify(message2) + '\n');
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(handler).toHaveBeenCalledTimes(2);
            expect(handler).toHaveBeenCalledWith(message1);
            expect(handler).toHaveBeenCalledWith(message2);
        });
        it('should handle partial messages across chunks', async () => {
            const handler = vi.fn();
            transport.onNotification(handler);
            transport.start();
            const message = { jsonrpc: '2.0', method: 'test' };
            const json = JSON.stringify(message) + '\n';
            // Send in parts
            mockInput.push(json.substring(0, 10));
            await new Promise((resolve) => setTimeout(resolve, 50));
            mockInput.push(json.substring(10));
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(handler).toHaveBeenCalledWith(message);
        });
        it('should ignore invalid JSON', async () => {
            const handler = vi.fn();
            transport.onNotification(handler);
            transport.start();
            mockInput.push('invalid json\n');
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(handler).not.toHaveBeenCalled();
        });
    });
    describe('stop', () => {
        it('should stop processing messages', async () => {
            const handler = vi.fn();
            transport.onNotification(handler);
            transport.start();
            transport.stop();
            mockInput.push(JSON.stringify({ jsonrpc: '2.0', method: 'test' }) + '\n');
            await new Promise((resolve) => setTimeout(resolve, 100));
            expect(handler).not.toHaveBeenCalled();
        });
    });
});
//# sourceMappingURL=StdioTransport.test.js.map