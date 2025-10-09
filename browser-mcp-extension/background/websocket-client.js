/**
 * WebSocket Client for Chrome Extension
 * 
 * Connects to the MCP server's WebSocket server
 * Replaces the old architecture where extension hosted the server
 */

export class WebSocketClient {
  constructor(url = 'ws://localhost:8765', options = {}) {
    this.url = url;
    this.options = {
      reconnectDelay: options.reconnectDelay || 2000,
      maxReconnectAttempts: options.maxReconnectAttempts || Infinity,
      ...options
    };
    
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.messageHandlers = [];
    this.reconnectTimer = null;
  }

  /**
   * Connect to MCP server
   */
  connect() {
    if (this.ws && (this.ws.readyState === WebSocket.CONNECTING || this.ws.readyState === WebSocket.OPEN)) {
      console.log('[WebSocketClient] Already connected or connecting');
      return;
    }

    console.log('[WebSocketClient] Connecting to MCP server:', this.url);
    
    try {
      this.ws = new WebSocket(this.url);
      
      this.ws.onopen = () => this.handleOpen();
      this.ws.onmessage = (event) => this.handleMessage(event);
      this.ws.onerror = (error) => this.handleError(error);
      this.ws.onclose = () => this.handleClose();
      
    } catch (error) {
      console.error('[WebSocketClient] Connection error:', error);
      this.scheduleReconnect();
    }
  }

  /**
   * Handle connection open
   */
  handleOpen() {
    console.log('[WebSocketClient] ✅ Connected to MCP server');
    this.connected = true;
    this.reconnectAttempts = 0;
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(event) {
    try {
      const message = JSON.parse(event.data);
      console.log('[WebSocketClient] Received message:', {
        method: message.method,
        id: message.id
      });
      
      // Call all registered handlers
      this.messageHandlers.forEach(handler => {
        try {
          handler(message);
        } catch (error) {
          console.error('[WebSocketClient] Handler error:', error);
        }
      });
      
    } catch (error) {
      console.error('[WebSocketClient] Failed to parse message:', error);
    }
  }

  /**
   * Handle error
   */
  handleError(error) {
    console.error('[WebSocketClient] WebSocket error:', error);
  }

  /**
   * Handle connection close
   */
  handleClose() {
    console.log('[WebSocketClient] Disconnected from MCP server');
    this.connected = false;
    this.ws = null;
    
    this.scheduleReconnect();
  }

  /**
   * Schedule reconnection attempt
   */
  scheduleReconnect() {
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) {
      console.error('[WebSocketClient] Max reconnection attempts reached');
      return;
    }
    
    if (this.reconnectTimer) {
      return; // Already scheduled
    }
    
    this.reconnectAttempts++;
    const delay = this.options.reconnectDelay;
    
    console.log(`[WebSocketClient] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);
    
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  /**
   * Send message to MCP server
   */
  sendMessage(message) {
    if (!this.isConnected()) {
      console.error('[WebSocketClient] Cannot send message: not connected');
      throw new Error('WebSocket not connected');
    }
    
    try {
      this.ws.send(JSON.stringify(message));
      console.log('[WebSocketClient] Sent message:', {
        method: message.method,
        id: message.id
      });
    } catch (error) {
      console.error('[WebSocketClient] Failed to send message:', error);
      throw error;
    }
  }

  /**
   * Register message handler
   */
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  /**
   * Check if connected
   */
  isConnected() {
    return this.connected && this.ws && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection count (for compatibility)
   */
  getConnectionCount() {
    return this.isConnected() ? 1 : 0;
  }

  /**
   * Disconnect
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    
    this.connected = false;
  }
}

