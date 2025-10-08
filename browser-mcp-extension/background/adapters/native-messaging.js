/**
 * Native Messaging Adapter - stdio communication with IDE
 * Pure JavaScript - Chrome Extension compatible
 * Implements INativeMessaging interface
 */

import { INativeMessaging } from '../interfaces.js';

/**
 * @class NativeMessaging
 * @implements {INativeMessaging}
 */
export class NativeMessaging extends INativeMessaging {
  /**
   * @param {Object} chromeApi - Chrome API (for testing, defaults to global chrome)
   * @param {Object} options - Configuration options
   */
  constructor(chromeApi = globalThis.chrome, options = {}) {
    super();
    this.chrome = chromeApi;
    this.options = {
      autoReconnect: options.autoReconnect || false,
      reconnectDelay: options.reconnectDelay || 2000,
      hostName: options.hostName || 'com.browser_mcp.host'
    };
    
    /** @type {Object|null} */
    this.port = null;
    
    /** @type {Array<Function>} */
    this.messageHandlers = [];
    
    /** @type {Array<Function>} */
    this.disconnectHandlers = [];
    
    /** @type {Array<Object>} */
    this.messageQueue = [];
    
    /** @type {boolean} */
    this.connected = false;
  }

  /**
   * Connect to native messaging host
   * @param {string} hostName - Native host name
   * @returns {Promise<void>}
   */
  async connect(hostName = null) {
    const host = hostName || this.options.hostName;
    
    try {
      this.port = this.chrome.runtime.connectNative(host);
      this.connected = true;
      
      // Setup message listener
      this.port.onMessage.addListener((message) => {
        this._handleIncomingMessage(message);
      });
      
      // Setup disconnect listener
      this.port.onDisconnect.addListener(() => {
        this._handleDisconnect();
      });
      
      // Send queued messages
      await this._flushQueue();
      
    } catch (error) {
      this.connected = false;
      throw new Error(`Failed to connect to native host: ${error.message}`);
    }
  }

  /**
   * Disconnect from native messaging host
   * @returns {Promise<void>}
   */
  async disconnect() {
    if (this.port) {
      try {
        this.port.disconnect();
      } catch (error) {
        console.warn('Error disconnecting:', error);
      }
      this.port = null;
    }
    this.connected = false;
  }

  /**
   * Send message to native host
   * @param {Object} message - Message to send
   * @returns {Promise<void>}
   */
  async sendMessage(message) {
    if (!this.connected || !this.port) {
      // Queue message for later
      this.messageQueue.push(message);
      return;
    }

    try {
      this.port.postMessage(message);
    } catch (error) {
      console.error('Failed to send message:', error);
      // Re-queue on error
      this.messageQueue.push(message);
      throw error;
    }
  }

  /**
   * Register message handler
   * @param {Function} handler - Message handler function
   * @returns {void}
   */
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  /**
   * Register disconnect handler
   * @param {Function} handler - Disconnect handler function
   * @returns {void}
   */
  onDisconnect(handler) {
    this.disconnectHandlers.push(handler);
  }

  /**
   * Check if connected
   * @returns {boolean}
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Get pending message count
   * @returns {number}
   */
  getPendingMessageCount() {
    return this.messageQueue.length;
  }

  /**
   * Handle incoming message
   * @private
   */
  _handleIncomingMessage(message) {
    for (const handler of this.messageHandlers) {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    }
  }

  /**
   * Handle disconnect
   * @private
   */
  _handleDisconnect() {
    console.log('[NativeMessaging] Disconnected from native host');
    this.connected = false;
    this.port = null;
    
    // Notify disconnect handlers
    for (const handler of this.disconnectHandlers) {
      try {
        handler();
      } catch (error) {
        console.error('Error in disconnect handler:', error);
      }
    }
    
    // Auto-reconnect if enabled
    if (this.options.autoReconnect) {
      setTimeout(() => {
        console.log('[NativeMessaging] Attempting auto-reconnect...');
        this.connect().catch(err => {
          console.error('[NativeMessaging] Auto-reconnect failed:', err);
        });
      }, this.options.reconnectDelay);
    }
  }

  /**
   * Flush message queue
   * @private
   */
  async _flushQueue() {
    while (this.messageQueue.length > 0 && this.connected) {
      const message = this.messageQueue.shift();
      try {
        await this.sendMessage(message);
      } catch (error) {
        console.error('Failed to flush queued message:', error);
        // Put it back at the front
        this.messageQueue.unshift(message);
        break;
      }
    }
  }
}

