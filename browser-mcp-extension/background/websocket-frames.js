/**
 * WebSocket Frame Parser
 *
 * Encodes/decodes WebSocket frames according to RFC 6455
 * Used by WebSocket server in Chrome extension
 */

export class WebSocketFrameParser {
  /**
   * Decode WebSocket frame from buffer
   * @param {ArrayBuffer} buffer - Raw frame data
   * @returns {Object} Decoded frame {fin, opcode, payload, masked}
   */
  static decode(buffer) {
    const view = new DataView(buffer);
    let offset = 0;

    // Byte 0: FIN, RSV, Opcode
    const byte0 = view.getUint8(offset++);
    const fin = (byte0 & 0x80) === 0x80;
    const rsv1 = (byte0 & 0x40) === 0x40;
    const rsv2 = (byte0 & 0x20) === 0x20;
    const rsv3 = (byte0 & 0x10) === 0x10;
    const opcode = byte0 & 0x0F;

    // Byte 1: MASK, Payload length
    const byte1 = view.getUint8(offset++);
    const masked = (byte1 & 0x80) === 0x80;
    let payloadLength = byte1 & 0x7F;

    // Extended payload length
    if (payloadLength === 126) {
      payloadLength = view.getUint16(offset);
      offset += 2;
    } else if (payloadLength === 127) {
      // Note: JavaScript can't handle 64-bit integers precisely
      // Skip first 4 bytes (high bits), read last 4 bytes
      offset += 4;
      payloadLength = view.getUint32(offset);
      offset += 4;
    }

    // Masking key (if masked)
    let maskingKey;
    if (masked) {
      maskingKey = new Uint8Array(buffer, offset, 4);
      offset += 4;
    }

    // Payload data
    let payload = new Uint8Array(buffer, offset, payloadLength);

    // Unmask if needed
    if (masked && maskingKey) {
      payload = WebSocketFrameParser.unmask(payload, maskingKey);
    }

    return {
      fin,
      rsv1,
      rsv2,
      rsv3,
      opcode,
      masked,
      payload,
      payloadLength
    };
  }

  /**
   * Encode WebSocket frame
   * @param {Uint8Array|string} data - Payload data
   * @param {number} opcode - Frame opcode (0x01=text, 0x02=binary, 0x08=close, 0x09=ping, 0x0A=pong)
   * @param {boolean} fin - Final fragment flag (default: true)
   * @returns {ArrayBuffer} Encoded frame
   */
  static encode(data, opcode = 0x01, fin = true) {
    // Convert string to UTF-8 bytes
    let payload;
    if (typeof data === 'string') {
      payload = new TextEncoder().encode(data);
    } else {
      payload = data;
    }

    const payloadLength = payload.length;
    let frameSize = 2 + payloadLength; // Minimum: 2 header bytes + payload

    // Calculate extended length bytes
    let extendedLength = 0;
    if (payloadLength > 125 && payloadLength <= 0xFFFF) {
      extendedLength = 2;
      frameSize += 2;
    } else if (payloadLength > 0xFFFF) {
      extendedLength = 8;
      frameSize += 8;
    }

    // Create frame buffer
    const frame = new ArrayBuffer(frameSize);
    const view = new DataView(frame);
    let offset = 0;

    // Byte 0: FIN + opcode
    view.setUint8(offset++, (fin ? 0x80 : 0x00) | opcode);

    // Byte 1: MASK + length
    if (payloadLength <= 125) {
      view.setUint8(offset++, payloadLength);
    } else if (extendedLength === 2) {
      view.setUint8(offset++, 126);
      view.setUint16(offset, payloadLength);
      offset += 2;
    } else {
      view.setUint8(offset++, 127);
      // Write 64-bit length (high bits first)
      view.setUint32(offset, 0); // High 32 bits (always 0 for JS)
      offset += 4;
      view.setUint32(offset, payloadLength); // Low 32 bits
      offset += 4;
    }

    // Copy payload
    new Uint8Array(frame, offset).set(payload);

    return frame;
  }

  /**
   * Unmask payload data
   * @param {Uint8Array} payload - Masked payload
   * @param {Uint8Array} maskingKey - 4-byte masking key
   * @returns {Uint8Array} Unmasked payload
   */
  static unmask(payload, maskingKey) {
    const unmasked = new Uint8Array(payload.length);
    for (let i = 0; i < payload.length; i++) {
      unmasked[i] = payload[i] ^ maskingKey[i % 4];
    }
    return unmasked;
  }

  /**
   * Parse WebSocket handshake request
   * @param {string} request - HTTP request string
   * @returns {Object} Parsed headers
   */
  static parseHandshake(request) {
    const lines = request.split('\r\n');
    const headers = {};

    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim().toLowerCase();
        const value = line.substring(colonIndex + 1).trim();
        headers[key] = value;
      }
    }

    return headers;
  }

  /**
   * Generate WebSocket accept key
   * @param {string} key - Client's Sec-WebSocket-Key
   * @returns {Promise<string>} Accept key
   */
  static async generateAcceptKey(key) {
    const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11';
    const concatenated = key + GUID;

    // Convert to bytes
    const encoder = new TextEncoder();
    const data = encoder.encode(concatenated);

    // SHA-1 hash
    const hashBuffer = await crypto.subtle.digest('SHA-1', data);

    // Base64 encode
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashBinary = String.fromCharCode(...hashArray);
    return btoa(hashBinary);
  }

  /**
   * Create WebSocket handshake response
   * @param {string} acceptKey - Generated accept key
   * @returns {string} HTTP response
   */
  static createHandshakeResponse(acceptKey) {
    return [
      'HTTP/1.1 101 Switching Protocols',
      'Upgrade: websocket',
      'Connection: Upgrade',
      `Sec-WebSocket-Accept: ${acceptKey}`,
      '\r\n'
    ].join('\r\n');
  }

  /**
   * Get opcode name
   * @param {number} opcode - Opcode value
   * @returns {string} Opcode name
   */
  static getOpcodeName(opcode) {
    const names = {
      0x00: 'continuation',
      0x01: 'text',
      0x02: 'binary',
      0x08: 'close',
      0x09: 'ping',
      0x0A: 'pong'
    };
    return names[opcode] || 'unknown';
  }
}
