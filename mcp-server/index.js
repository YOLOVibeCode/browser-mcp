#!/usr/bin/env node

/**
 * Browser MCP Server - Main Entry Point
 *
 * Bridges IDE (via stdio/MCP) to Chrome Extension (via WebSocket)
 *
 * Architecture:
 * IDE (stdio) ↔ This Server ↔ Chrome Extension (WebSocket)
 */

const StdioHandler = require('./stdio-handler');
const WebSocketClient = require('./websocket-client');
const MessageQueue = require('./message-queue');
const { version } = require('./package.json');

class MCPServer {
  constructor(options = {}) {
    this.options = {
      wsPort: options.wsPort || process.env.BROWSER_MCP_PORT || 8765,
      wsHost: options.wsHost || 'localhost',
      ...options
    };

    this.wsUrl = `ws://${this.options.wsHost}:${this.options.wsPort}`;

    // Initialize components
    this.stdio = new StdioHandler();
    this.ws = new WebSocketClient(this.wsUrl);
    this.queue = new MessageQueue();

    this.setupHandlers();
  }

  /**
   * Setup event handlers
   */
  setupHandlers() {
    // Handle messages from IDE
    this.stdio.onMessage(async (message) => {
      await this.handleIDEMessage(message);
    });

    // Handle WebSocket connection events
    this.ws.on('connect', () => {
      this.log('Connected to Chrome Extension');
      this.flushQueue();
    });

    this.ws.on('disconnect', () => {
      this.log('Disconnected from Chrome Extension');
    });

    this.ws.on('error', (error) => {
      this.log('WebSocket error', { error: error.message });
    });

    // Handle process signals
    process.on('SIGTERM', () => this.shutdown('SIGTERM'));
    process.on('SIGINT', () => this.shutdown('SIGINT'));
  }

  /**
   * Handle message from IDE
   */
  async handleIDEMessage(message) {
    this.log('Received from IDE', {
      method: message.method,
      id: message.id
    });

    // Check if connected
    if (!this.ws.isConnected()) {
      this.log('Extension not connected, queuing message');
      this.queue.add(message);

      // Send error response to IDE
      this.stdio.sendError(
        message.id,
        -32603,
        'Chrome Extension not connected. Make sure the extension is loaded.',
        {
          queueSize: this.queue.size(),
          hint: 'Load the Browser MCP extension in Chrome and try again'
        }
      );
      return;
    }

    try {
      // Forward to extension and wait for response
      const response = await this.ws.sendAndWait(message);

      // Forward response to IDE
      this.stdio.sendMessage(response);

      this.log('Forwarded response to IDE', {
        id: response.id,
        hasError: !!response.error
      });
    } catch (error) {
      this.log('Failed to forward message', {
        error: error.message,
        id: message.id
      });

      // Send error to IDE
      this.stdio.sendError(
        message.id,
        -32603,
        `Failed to communicate with extension: ${error.message}`
      );
    }
  }

  /**
   * Flush queued messages
   */
  async flushQueue() {
    if (this.queue.isEmpty()) {
      return;
    }

    this.log('Flushing message queue', {
      count: this.queue.size()
    });

    await this.queue.flush(async (message) => {
      // Resend queued message
      const response = await this.ws.sendAndWait(message);
      this.stdio.sendMessage(response);
    });
  }

  /**
   * Start the server
   */
  async start() {
    this.log('Starting Browser MCP Server', {
      version: version,
      wsUrl: this.wsUrl
    });

    // Connect to extension
    this.ws.connect();

    this.log('Server started');
    this.log('Waiting for Chrome Extension connection...');
    this.log('Make sure Browser MCP extension is loaded in Chrome');
  }

  /**
   * Shutdown gracefully
   */
  shutdown(signal) {
    this.log('Shutting down', { signal });

    // Disconnect WebSocket
    this.ws.disconnect();

    // Exit
    process.exit(0);
  }

  /**
   * Log helper
   */
  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      component: 'MCPServer',
      message,
      ...data
    };
    process.stderr.write(JSON.stringify(logData) + '\n');
  }
}

// Start server
if (require.main === module) {
  const server = new MCPServer();
  server.start().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = MCPServer;
