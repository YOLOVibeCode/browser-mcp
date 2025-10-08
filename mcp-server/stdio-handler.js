#!/usr/bin/env node

/**
 * StdioHandler - MCP Protocol over stdio
 *
 * Reads newline-delimited JSON from stdin
 * Writes newline-delimited JSON to stdout
 * All logging goes to stderr
 */

class StdioHandler {
  constructor() {
    this.messageHandlers = [];
    this.buffer = '';

    // Setup stdin
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => this.handleData(chunk));
    process.stdin.on('end', () => this.handleEnd());

    // Keep process alive
    process.stdin.resume();
  }

  /**
   * Handle incoming data from stdin
   */
  handleData(chunk) {
    this.buffer += chunk;

    // Split by newlines
    const lines = this.buffer.split('\n');

    // Keep the last incomplete line in buffer
    this.buffer = lines.pop() || '';

    // Process complete lines
    for (const line of lines) {
      if (line.trim()) {
        try {
          const message = JSON.parse(line);
          this.log('Received MCP message', { method: message.method, id: message.id });
          this.emitMessage(message);
        } catch (error) {
          this.log('Failed to parse message', { error: error.message, line });
        }
      }
    }
  }

  /**
   * Handle stdin end
   */
  handleEnd() {
    this.log('Stdin closed, exiting');
    process.exit(0);
  }

  /**
   * Register a message handler
   */
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  /**
   * Emit message to all handlers
   */
  emitMessage(message) {
    for (const handler of this.messageHandlers) {
      try {
        handler(message);
      } catch (error) {
        this.log('Handler error', { error: error.message });
      }
    }
  }

  /**
   * Send MCP response to stdout
   */
  sendMessage(message) {
    const json = JSON.stringify(message);
    process.stdout.write(json + '\n');
    this.log('Sent MCP response', { id: message.id, hasError: !!message.error });
  }

  /**
   * Send error response
   */
  sendError(id, code, message, data = null) {
    const response = {
      jsonrpc: '2.0',
      id: id || null,
      error: {
        code,
        message
      }
    };

    if (data) {
      response.error.data = data;
    }

    this.sendMessage(response);
  }

  /**
   * Log to stderr (stdout is used for protocol)
   */
  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      message,
      ...data
    };
    process.stderr.write(JSON.stringify(logData) + '\n');
  }
}

module.exports = StdioHandler;
