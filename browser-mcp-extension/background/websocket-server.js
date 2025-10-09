/**
 * WebSocket Server for Chrome Extension
 *
 * Uses chrome.sockets.tcpServer API to create WebSocket server
 * Handles WebSocket handshake and frame parsing
 */

import { WebSocketFrameParser } from './websocket-frames.js';

export class WebSocketServer {
  constructor(options = {}) {
    this.options = {
      port: options.port || 8765,
      host: options.host || '127.0.0.1',
      ...options
    };

    this.serverSocketId = null;
    this.connections = new Map(); // socketId -> connection state
    this.messageHandlers = [];
  }

  /**
   * Start WebSocket server
   */
  async start() {
    console.log('[WebSocketServer] Starting server...', this.options);

    // Try ports in range if default is busy
    for (let port = this.options.port; port < this.options.port + 10; port++) {
      try {
        await this.listen(port);
        console.log(`[WebSocketServer] ✅ Server started on ${this.options.host}:${port}`);
        return port;
      } catch (error) {
        console.error(`[WebSocketServer] ❌ Port ${port} failed:`, error.message);
        console.error('[WebSocketServer] Error details:', error);
        continue;
      }
    }

    const error = new Error('Failed to start WebSocket server: No available ports (all 10 attempts failed)');
    console.error('[WebSocketServer] CRITICAL:', error.message);
    console.error('[WebSocketServer] This usually means chrome.sockets.tcpServer API is not working');
    throw error;
  }

  /**
   * Listen on port
   */
  async listen(port) {
    return new Promise((resolve, reject) => {
      // Check if chrome.sockets API is available
      if (!chrome.sockets || !chrome.sockets.tcpServer) {
        const availableAPIs = Object.keys(chrome).filter(k => !k.startsWith('_'));
        const error = new Error(
          `chrome.sockets.tcpServer API is NOT available.\n` +
          `Available Chrome APIs: ${availableAPIs.join(', ')}\n` +
          `This API may not be supported in Manifest V3 service workers or test environments.`
        );
        console.error('[WebSocketServer] CRITICAL ERROR:', error.message);
        reject(error);
        return;
      }

      console.log('[WebSocketServer] ✓ chrome.sockets API available, creating TCP server...');

      // Create TCP server socket
      chrome.sockets.tcpServer.create({}, (createInfo) => {
        if (chrome.runtime.lastError) {
          const error = new Error(`Failed to create TCP server: ${chrome.runtime.lastError.message}`);
          console.error('[WebSocketServer]', error.message);
          reject(error);
          return;
        }

        if (!createInfo || !createInfo.socketId) {
          const error = new Error('Failed to create socket: No socketId returned');
          console.error('[WebSocketServer]', error.message);
          reject(error);
          return;
        }

        this.serverSocketId = createInfo.socketId;
        console.log('[WebSocketServer] ✓ TCP server socket created:', createInfo.socketId);

        // Listen on port
        chrome.sockets.tcpServer.listen(
          this.serverSocketId,
          this.options.host,
          port,
          (result) => {
            if (chrome.runtime.lastError) {
              const error = new Error(`Failed to listen on port ${port}: ${chrome.runtime.lastError.message}`);
              console.error('[WebSocketServer]', error.message);
              reject(error);
              return;
            }

            if (result < 0) {
              const errorCodes = {
                '-2': 'FAILED',
                '-3': 'INVALID_ARGUMENT',
                '-4': 'INVALID_OPERATION',
                '-15': 'SOCKET_NOT_CONNECTED',  
                '-100': 'CONNECTION_REFUSED',
                '-102': 'ADDRESS_IN_USE',
                '-147': 'ADDRESS_INVALID'
              };
              const errorDesc = errorCodes[result] || 'UNKNOWN';
              const error = new Error(`Failed to listen on port ${port}: ${errorDesc} (code: ${result})`);
              console.error('[WebSocketServer]', error.message);
              
              // Special handling for certain errors
              if (result === -147 || result === -15) {
                console.error('[WebSocketServer] This may be a Chrome extension permissions issue');
                console.error('[WebSocketServer] Try reloading the extension or checking manifest permissions');
              }
              
              reject(error);
              return;
            }

            console.log('[WebSocketServer] ✓ Successfully listening on ${this.options.host}:${port}');

            // Setup accept handler
            chrome.sockets.tcpServer.onAccept.addListener((info) => {
              if (info.socketId === this.serverSocketId) {
                this.handleAccept(info.clientSocketId);
              }
            });

            // Setup receive handler
            chrome.sockets.tcp.onReceive.addListener((info) => {
              this.handleReceive(info.socketId, info.data);
            });

            // Setup error handler
            chrome.sockets.tcp.onReceiveError.addListener((info) => {
              this.handleError(info.socketId, info.resultCode);
            });

            console.log('[WebSocketServer] ✓ Event handlers registered');
            resolve();
          }
        );
      });
    });
  }

  /**
   * Handle new connection
   */
  async handleAccept(socketId) {
    console.log('[WebSocketServer] New connection:', socketId);

    // Initialize connection state
    this.connections.set(socketId, {
      socketId,
      handshakeDone: false,
      buffer: new Uint8Array(0)
    });

    // Set socket options
    chrome.sockets.tcp.setNoDelay(socketId, true, () => {});
    chrome.sockets.tcp.setKeepAlive(socketId, true, 60, () => {});
  }

  /**
   * Handle incoming data
   */
  async handleReceive(socketId, data) {
    const conn = this.connections.get(socketId);
    if (!conn) return;

    const dataArray = new Uint8Array(data);

    if (!conn.handshakeDone) {
      // Handle WebSocket handshake
      await this.handleHandshake(socketId, dataArray);
    } else {
      // Handle WebSocket frames
      await this.handleFrame(socketId, dataArray);
    }
  }

  /**
   * Handle WebSocket handshake
   */
  async handleHandshake(socketId, data) {
    const conn = this.connections.get(socketId);

    // Append to buffer
    conn.buffer = this.appendBuffer(conn.buffer, data);

    // Check if we have complete handshake (ends with \r\n\r\n)
    const requestString = new TextDecoder().decode(conn.buffer);
    if (!requestString.includes('\r\n\r\n')) {
      return; // Wait for more data
    }

    console.log('[WebSocketServer] Received handshake request');

    // Parse handshake
    const headers = WebSocketFrameParser.parseHandshake(requestString);
    const wsKey = headers['sec-websocket-key'];

    if (!wsKey) {
      console.error('[WebSocketServer] Invalid handshake: missing Sec-WebSocket-Key');
      this.closeConnection(socketId);
      return;
    }

    // Generate accept key
    const acceptKey = await WebSocketFrameParser.generateAcceptKey(wsKey);

    // Create handshake response
    const response = WebSocketFrameParser.createHandshakeResponse(acceptKey);
    const responseData = new TextEncoder().encode(response);

    // Send response
    chrome.sockets.tcp.send(socketId, responseData.buffer, (sendInfo) => {
      if (sendInfo.resultCode < 0) {
        console.error('[WebSocketServer] Failed to send handshake response');
        this.closeConnection(socketId);
        return;
      }

      console.log('[WebSocketServer] Handshake complete for socket', socketId);
      conn.handshakeDone = true;
      conn.buffer = new Uint8Array(0); // Clear buffer
    });
  }

  /**
   * Handle WebSocket frame
   */
  async handleFrame(socketId, data) {
    const conn = this.connections.get(socketId);

    // Append to buffer
    conn.buffer = this.appendBuffer(conn.buffer, data);

    // Try to parse frames from buffer
    while (conn.buffer.length > 0) {
      try {
        const frame = WebSocketFrameParser.decode(conn.buffer.buffer);

        // Calculate frame size
        let frameSize = 2; // Minimum header
        let payloadLen = frame.payloadLength;

        if (payloadLen <= 125) {
          // Short payload
        } else if (payloadLen === 126) {
          frameSize += 2;
        } else {
          frameSize += 8;
        }

        if (frame.masked) {
          frameSize += 4; // Masking key
        }

        frameSize += frame.payloadLength;

        // Check if we have complete frame
        if (conn.buffer.length < frameSize) {
          break; // Wait for more data
        }

        // Remove processed frame from buffer
        conn.buffer = conn.buffer.slice(frameSize);

        // Handle frame by opcode
        await this.handleFrameData(socketId, frame);
      } catch (error) {
        console.error('[WebSocketServer] Frame parse error:', error);
        break; // Wait for more data
      }
    }
  }

  /**
   * Handle frame data by opcode
   */
  async handleFrameData(socketId, frame) {
    const opcodeName = WebSocketFrameParser.getOpcodeName(frame.opcode);

    switch (frame.opcode) {
      case 0x01: // Text frame
      case 0x02: // Binary frame
        try {
          const payload = new TextDecoder().decode(frame.payload);
          const message = JSON.parse(payload);
          console.log('[WebSocketServer] Received message:', message.method || 'response');

          // Emit to handlers
          for (const handler of this.messageHandlers) {
            try {
              handler(message, socketId);
            } catch (error) {
              console.error('[WebSocketServer] Handler error:', error);
            }
          }
        } catch (error) {
          console.error('[WebSocketServer] Failed to parse message:', error);
        }
        break;

      case 0x08: // Close
        console.log('[WebSocketServer] Close frame received');
        this.closeConnection(socketId);
        break;

      case 0x09: // Ping
        console.log('[WebSocketServer] Ping received, sending pong');
        this.sendFrame(socketId, frame.payload, 0x0A); // Send pong
        break;

      case 0x0A: // Pong
        console.log('[WebSocketServer] Pong received');
        break;

      default:
        console.log(`[WebSocketServer] Unknown opcode: ${frame.opcode}`);
    }
  }

  /**
   * Send message to client
   */
  sendMessage(socketId, message) {
    const payload = JSON.stringify(message);
    this.sendFrame(socketId, payload, 0x01); // Text frame
  }

  /**
   * Send frame to client
   */
  sendFrame(socketId, data, opcode = 0x01) {
    const conn = this.connections.get(socketId);
    if (!conn || !conn.handshakeDone) {
      console.error('[WebSocketServer] Cannot send: connection not ready');
      return;
    }

    const frame = WebSocketFrameParser.encode(data, opcode);

    chrome.sockets.tcp.send(socketId, frame, (sendInfo) => {
      if (sendInfo.resultCode < 0) {
        console.error('[WebSocketServer] Send failed:', sendInfo.resultCode);
        this.closeConnection(socketId);
      }
    });
  }

  /**
   * Close connection
   */
  closeConnection(socketId) {
    console.log('[WebSocketServer] Closing connection:', socketId);

    chrome.sockets.tcp.close(socketId, () => {
      this.connections.delete(socketId);
    });
  }

  /**
   * Stop server
   */
  async stop() {
    console.log('[WebSocketServer] Stopping server...');

    // Close all connections
    for (const socketId of this.connections.keys()) {
      this.closeConnection(socketId);
    }

    // Close server socket
    if (this.serverSocketId !== null) {
      chrome.sockets.tcpServer.close(this.serverSocketId, () => {
        console.log('[WebSocketServer] Server stopped');
      });
      this.serverSocketId = null;
    }
  }

  /**
   * Register message handler
   */
  onMessage(handler) {
    this.messageHandlers.push(handler);
  }

  /**
   * Get active connection count
   */
  getConnectionCount() {
    return this.connections.size;
  }

  /**
   * Append two Uint8Arrays
   */
  appendBuffer(buffer1, buffer2) {
    const result = new Uint8Array(buffer1.length + buffer2.length);
    result.set(buffer1, 0);
    result.set(buffer2, buffer1.length);
    return result;
  }
}
