/**
 * WebSocket Server Host
 * 
 * Hosts a WebSocket server that the Chrome extension connects to
 * Replaces the old architecture where extension hosted the server
 */

const { WebSocketServer } = require('ws');
const EventEmitter = require('events');

class WebSocketServerHost extends EventEmitter {
  constructor(port = 8765, options = {}) {
    super();
    
    this.port = port;
    this.options = options;
    this.wss = null;
    this.extensionConnection = null;
    this.pendingRequests = new Map();
    this.requestId = 0;
  }

  /**
   * Start WebSocket server
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.wss = new WebSocketServer({ port: this.port });
        
        this.wss.on('listening', () => {
          this.log(`WebSocket server listening on ws://localhost:${this.port}`);
          resolve();
        });
        
        this.wss.on('connection', (ws, req) => {
          this.handleConnection(ws, req);
        });
        
        this.wss.on('error', (error) => {
          this.log('WebSocket server error:', error.message);
          if (error.code === 'EADDRINUSE') {
            this.log(`Port ${this.port} is already in use. This is normal if multiple MCP servers are running.`);
            // Don't reject, just log the error and continue
            resolve();
          } else {
            reject(error);
          }
        });
        
      } catch (error) {
        this.log('Failed to create WebSocket server:', error.message);
        reject(error);
      }
    });
  }

  /**
   * Handle new connection from extension
   */
  handleConnection(ws, req) {
    const clientIp = req.socket.remoteAddress;
    this.log('Extension connected from:', clientIp);
    
    // Store connection
    this.extensionConnection = ws;
    this.emit('connect');
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleMessage(message);
      } catch (error) {
        this.log('Failed to parse message:', error.message);
      }
    });
    
    ws.on('close', () => {
      this.log('Extension disconnected');
      this.extensionConnection = null;
      this.emit('disconnect');
    });
    
    ws.on('error', (error) => {
      this.log('Connection error:', error.message);
      this.emit('error', error);
    });
  }

  /**
   * Handle message from extension
   */
  handleMessage(message) {
    // This is a response to a request we sent
    if (message.id && this.pendingRequests.has(message.id)) {
      const { resolve } = this.pendingRequests.get(message.id);
      this.pendingRequests.delete(message.id);
      resolve(message);
    } else {
      // Unsolicited message from extension
      this.emit('message', message);
    }
  }

  /**
   * Send message to extension
   */
  send(message) {
    if (!this.isConnected()) {
      throw new Error('Extension not connected');
    }
    
    this.extensionConnection.send(JSON.stringify(message));
  }

  /**
   * Send message to first available client
   */
  sendToFirstClient(message) {
    if (this.wss && this.wss.clients.size > 0) {
      const firstClient = Array.from(this.wss.clients)[0];
      if (firstClient.readyState === 1) { // OPEN
        firstClient.send(JSON.stringify(message));
        return true;
      }
    }
    return false;
  }

  /**
   * Send message and wait for response
   */
  sendAndWait(message, timeout = 30000) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected()) {
        reject(new Error('Extension not connected'));
        return;
      }
      
      // Store resolver
      this.pendingRequests.set(message.id, { resolve, reject });
      
      // Set timeout
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(message.id)) {
          this.pendingRequests.delete(message.id);
          reject(new Error(`Request ${message.id} timed out after ${timeout}ms`));
        }
      }, timeout);
      
      // Send message
      try {
        this.extensionConnection.send(JSON.stringify(message));
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(message.id);
        reject(error);
      }
    });
  }

  /**
   * Check if extension is connected
   */
  isConnected() {
    return this.extensionConnection && this.extensionConnection.readyState === 1; // OPEN
  }

  /**
   * Get connection count
   */
  getConnectionCount() {
    return this.wss ? this.wss.clients.size : 0;
  }

  /**
   * Stop server
   */
  stop() {
    if (this.extensionConnection) {
      this.extensionConnection.close();
      this.extensionConnection = null;
    }
    
    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
    
    this.pendingRequests.clear();
  }

  /**
   * Log helper
   */
  log(...args) {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [WebSocketServerHost]`, ...args);
  }
}

module.exports = WebSocketServerHost;

