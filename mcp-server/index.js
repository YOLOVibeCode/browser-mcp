#!/usr/bin/env node

/**
 * Browser MCP Server - Main Entry Point
 *
 * Bridges IDE (via stdio/MCP) to Chrome Extension (via WebSocket)
 *
 * Architecture:
 * IDE (stdio) ↔ This Server (WebSocket SERVER) ↔ Chrome Extension (WebSocket CLIENT)
 * 
 * Note: Architecture flipped in v4.0.3 because chrome.sockets API
 * is not available in Manifest V3 service workers
 */

const StdioHandler = require('./stdio-handler');
const WebSocketServerHost = require('./websocket-server-host');
const MessageQueue = require('./message-queue');
const http = require('http');
const { version } = require('./package.json');

class MCPServer {
  constructor(options = {}) {
    // Ensure wsPort is always a number
    const rawPort = options.wsPort || process.env.BROWSER_MCP_PORT || 8765;
    this.options = {
      wsPort: parseInt(rawPort),
      ...options
    };

    // Detect extension installation path
    this.extensionPath = this.detectExtensionPath();

    // Initialize components
    this.stdio = new StdioHandler();
    this.ws = new WebSocketServerHost(this.options.wsPort);
    this.queue = new MessageQueue();
    this.httpServer = null;

    this.setupHandlers();
  }

  /**
   * Detect where the extension is installed
   */
  detectExtensionPath() {
    const os = require('os');
    const path = require('path');
    const fs = require('fs');

    const homeDir = os.homedir();

    // Common installation locations
    const possiblePaths = [
      path.join(homeDir, 'Downloads', 'browser-mcp-setup', 'browser-mcp-extension'),
      path.join(homeDir, 'browser-mcp', 'browser-mcp-extension'),
      path.join(homeDir, '.browser-mcp', 'browser-mcp-extension'),
      '/tmp/browser-mcp-setup/browser-mcp-extension',
    ];

    // Check which path exists
    for (const p of possiblePaths) {
      try {
        if (fs.existsSync(p)) {
          return p;
        }
      } catch (e) {
        // Path doesn't exist, continue
      }
    }

    // Default fallback
    return path.join(homeDir, 'Downloads', 'browser-mcp-setup', 'browser-mcp-extension');
  }

  /**
   * Get platform-specific setup instructions
   */
  getSetupInstructions() {
    const os = require('os');
    const platform = os.platform();

    let chromeUrl = 'chrome://extensions/';
    let browserName = 'Chrome';

    // Detect browser based on platform
    if (platform === 'darwin') {
      // macOS - could be Chrome, Chromium, Brave, Edge
      browserName = 'Chrome (or Chromium/Brave/Edge)';
    } else if (platform === 'win32') {
      browserName = 'Chrome (or Edge)';
    } else {
      browserName = 'Chrome (or Chromium)';
    }

    return `🔌 Browser MCP Server is running, but the Chrome Extension is not connected yet.

📥 **Quick Setup (takes 30 seconds):**

**Step 1:** Open ${browserName} and paste this in the address bar:
   ${chromeUrl}

**Step 2:** Enable "Developer mode"
   Look for a toggle switch in the top-right corner and turn it ON

**Step 3:** Click "Load unpacked" button

**Step 4:** Copy and paste this path:
   ${this.extensionPath}

**Step 5:** Press Enter / Click "Select"

✅ **That's it!** The extension will automatically connect to this server.
   You'll then have access to 33 browser debugging tools!

💡 **Tip:** You can also navigate to the folder in Finder/Explorer and drag it into the Chrome extensions page.

The server is waiting patiently for the extension to connect.`;
  }

  /**
   * Get tool description for setup instructions
   */
  getToolDescription() {
    return `🔌 Browser MCP Extension Not Connected

The MCP server is running, but the Chrome extension needs to be loaded.

**📍 Extension Location:**
${this.extensionPath}

**🚀 Quick Setup:**
1. Open Chrome → chrome://extensions/
2. Enable "Developer mode" (top-right toggle)
3. Click "Load unpacked"
4. Paste the path above and press Enter

**📦 What you'll get once connected:**
• DOM inspection (8 tools)
• Network monitoring (6 tools)
• Console debugging (5 tools)
• Storage management (5 tools)
• Framework detection (4 tools)
• Plus 5 more specialized tools

The server is waiting patiently. Once you load the extension, it will auto-connect!`;
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

    // Handle 'initialize' method specially - always respond successfully
    if (message.method === 'initialize') {
      this.log('Handling initialize request');

      const initResponse = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: {},
            resources: {},
            prompts: {}
          },
          serverInfo: {
            name: 'browser-mcp',
            version: version
          },
          instructions: this.ws.isConnected()
            ? 'Connected to Chrome Extension. Ready to use 33 browser debugging tools!'
            : this.getSetupInstructions()
        }
      };

      this.stdio.sendMessage(initResponse);
      return;
    }

    // Handle notifications - they don't need responses
    if (message.method && message.method.startsWith('notifications/')) {
      this.log('Received notification, no response needed', { method: message.method });
      return;
    }

    // Handle 'tools/list' method - show status
    if (message.method === 'tools/list') {
      this.log('Handling tools/list request');

      // Wait briefly for extension to connect if not already connected
      if (!this.ws.isConnected()) {
        this.log('Extension not connected, waiting 20 seconds...');
        await new Promise(resolve => setTimeout(resolve, 20000));
      }

      // If connected, forward to extension
      if (this.ws.isConnected()) {
        try {
          this.log('Extension is connected, forwarding tools/list to extension');
          const response = await this.ws.sendAndWait(message);
          this.log('Received tools/list response from extension', {
            toolCount: response.result?.tools?.length
          });
          this.stdio.sendMessage(response);
          return;
        } catch (error) {
          this.log('Failed to get tools from extension', { error: error.message });
          // Fall back to status message
        }
      } else {
        this.log('Extension still not connected after waiting, showing setup instructions');
      }

      // Not connected or error - show setup instructions
      const toolsResponse = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          tools: [{
            name: 'browser-mcp-setup-instructions',
            description: this.getToolDescription(),
            inputSchema: {
              type: 'object',
              properties: {
                action: {
                  type: 'string',
                  description: 'Type "help" to see these instructions again',
                  enum: ['help']
                }
              }
            }
          }]
        }
      };

      this.stdio.sendMessage(toolsResponse);
      return;
    }

    // Handle 'prompts/list' and 'resources/list' - return empty lists
    if (message.method === 'prompts/list' || message.method === 'resources/list') {
      this.log('Handling ' + message.method + ' request');

      const emptyResponse = {
        jsonrpc: '2.0',
        id: message.id,
        result: message.method === 'prompts/list' ? { prompts: [] } : { resources: [] }
      };

      this.stdio.sendMessage(emptyResponse);
      return;
    }

    // Check if connected for other methods
    if (!this.ws.isConnected()) {
      this.log('Extension not connected, queuing message');
      this.queue.add(message);

      // Only send error for requests with IDs (not notifications)
      if (message.id !== undefined) {
        this.stdio.sendError(
          message.id,
          -32603,
          'Waiting for Chrome Extension to connect... Please load the Browser MCP extension in Chrome and the connection will be established automatically.',
          {
            queueSize: this.queue.size(),
            hint: 'The server is running and waiting patiently. Load the extension and try again.'
          }
        );
      }
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
      port: this.options.wsPort
    });

    // Start HTTP server for health checks
    this.startHttpServer();

    // Start WebSocket server
    await this.ws.start();

    this.log('Server started');
    this.log('WebSocket server listening on port ' + this.options.wsPort);
    this.log('HTTP health endpoint available at http://localhost:' + (this.options.wsPort + 1) + '/health');
    this.log('Waiting for Chrome Extension to connect...');
    this.log('Make sure Browser MCP extension is loaded in Chrome');
  }

  /**
   * Start HTTP server for health checks
   */
  startHttpServer() {
    this.httpServer = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: 'healthy',
          version: version,
          websocketConnected: this.ws.isConnected(),
          timestamp: new Date().toISOString()
        }));
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found');
      }
    });

    this.httpServer.listen(this.options.wsPort + 1, () => {
      this.log('HTTP health server started on port ' + (this.options.wsPort + 1));
    });
  }

  /**
   * Shutdown gracefully
   */
  shutdown(signal) {
    this.log('Shutting down', { signal });

    // Stop HTTP server
    if (this.httpServer) {
      this.httpServer.close();
    }

    // Stop WebSocket server
    this.ws.stop();

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
