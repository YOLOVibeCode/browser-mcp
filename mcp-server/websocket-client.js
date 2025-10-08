#!/usr/bin/env node

/**
 * WebSocketClient - Connects to Chrome Extension WebSocket server
 *
 * Handles:
 * - Connection to ws://localhost:PORT
 * - Auto-reconnect on disconnect
 * - Message sending/receiving
 * - Request/response tracking
 */

const WebSocket = require('ws');
const EventEmitter = require('events');

class WebSocketClient extends EventEmitter {
  constructor(url, options = {}) {
    super();

    this.url = url;
    this.options = {
      reconnectDelay: options.reconnectDelay || 2000,
      maxReconnectAttempts: options.maxReconnectAttempts || Infinity,
      pingInterval: options.pingInterval || 20000,
      ...options
    };

    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.pendingRequests = new Map();
    this.requestIdCounter = 0;
    this.pingTimer = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect() {
    this.log('Connecting to extension', { url: this.url });

    try {
      this.ws = new WebSocket(this.url);

      this.ws.on('open', () => this.handleOpen());
      this.ws.on('message', (data) => this.handleMessage(data));
      this.ws.on('error', (error) => this.handleError(error));
      this.ws.on('close', () => this.handleClose());
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handle connection open
   */
  handleOpen() {
    this.log('Connected to extension');
    this.connected = true;
    this.reconnectAttempts = 0;

    // Start keepalive ping
    this.startPing();

    this.emit('connect');
  }

  /**
   * Handle incoming message
   */
  handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      this.log('Received message', { id: message.id, hasError: !!message.error });

      // If this is a response to a request, resolve the promise
      if (message.id && this.pendingRequests.has(message.id)) {
        const { resolve } = this.pendingRequests.get(message.id);
        this.pendingRequests.delete(message.id);
        resolve(message);
      } else {
        // Unsolicited message (shouldn't happen in our protocol)
        this.emit('message', message);
      }
    } catch (error) {
      this.log('Failed to parse message', { error: error.message });
    }
  }

  /**
   * Handle error
   */
  handleError(error) {
    this.log('WebSocket error', { error: error.message });
    this.emit('error', error);
  }

  /**
   * Handle connection close
   */
  handleClose() {
    this.log('Disconnected from extension');
    this.connected = false;
    this.stopPing();

    // Reject all pending requests
    for (const [id, { reject }] of this.pendingRequests) {
      reject(new Error('WebSocket disconnected'));
    }
    this.pendingRequests.clear();

    this.emit('disconnect');

    // Auto-reconnect
    if (this.reconnectAttempts < this.options.maxReconnectAttempts) {
      this.reconnectAttempts++;
      this.log('Reconnecting...', {
        attempt: this.reconnectAttempts,
        delay: this.options.reconnectDelay
      });

      setTimeout(() => this.connect(), this.options.reconnectDelay);
    } else {
      this.log('Max reconnect attempts reached');
    }
  }

  /**
   * Send message and wait for response
   */
  async sendAndWait(message, timeout = 30000) {
    if (!this.connected) {
      throw new Error('Not connected to extension');
    }

    return new Promise((resolve, reject) => {
      // Add to pending requests
      this.pendingRequests.set(message.id, { resolve, reject });

      // Set timeout
      const timer = setTimeout(() => {
        if (this.pendingRequests.has(message.id)) {
          this.pendingRequests.delete(message.id);
          reject(new Error('Request timeout'));
        }
      }, timeout);

      // Send message
      try {
        this.ws.send(JSON.stringify(message));
        this.log('Sent request', { method: message.method, id: message.id });
      } catch (error) {
        clearTimeout(timer);
        this.pendingRequests.delete(message.id);
        reject(error);
      }
    });
  }

  /**
   * Send message without waiting for response
   */
  send(message) {
    if (!this.connected) {
      throw new Error('Not connected to extension');
    }

    this.ws.send(JSON.stringify(message));
    this.log('Sent message', { id: message.id });
  }

  /**
   * Start keepalive ping
   */
  startPing() {
    this.pingTimer = setInterval(() => {
      if (this.connected) {
        try {
          this.ws.ping();
          this.log('Sent ping');
        } catch (error) {
          this.log('Ping failed', { error: error.message });
        }
      }
    }, this.options.pingInterval);
  }

  /**
   * Stop keepalive ping
   */
  stopPing() {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Disconnect
   */
  disconnect() {
    this.log('Disconnecting');
    this.stopPing();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Log helper
   */
  log(message, data = {}) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      component: 'WebSocketClient',
      message,
      ...data
    };
    process.stderr.write(JSON.stringify(logData) + '\n');
  }
}

module.exports = WebSocketClient;
