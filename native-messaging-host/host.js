#!/usr/bin/env node

/**
 * Native Messaging Host for Browser MCP
 * 
 * This script bridges Claude Desktop / Cursor IDE to the Chrome extension.
 * 
 * Flow:
 * IDE (stdin/stdout) <-> This Script <-> Chrome Extension (Native Messaging)
 * 
 * Protocol: JSON-RPC messages via Native Messaging
 */

const EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE'; // Will be set during installation

// Native Messaging protocol: Each message is prefixed with 4-byte length
function readMessage() {
  return new Promise((resolve, reject) => {
    const lengthBuffer = Buffer.alloc(4);
    let bytesRead = 0;

    // Read 4-byte length prefix
    const readLength = () => {
      const chunk = process.stdin.read(4 - bytesRead);
      if (chunk === null) {
        process.stdin.once('readable', readLength);
        return;
      }

      chunk.copy(lengthBuffer, bytesRead);
      bytesRead += chunk.length;

      if (bytesRead === 4) {
        const messageLength = lengthBuffer.readUInt32LE(0);
        readMessageBody(messageLength);
      } else {
        readLength();
      }
    };

    // Read message body
    const readMessageBody = (length) => {
      const messageBuffer = Buffer.alloc(length);
      let bodyBytesRead = 0;

      const readBody = () => {
        const chunk = process.stdin.read(length - bodyBytesRead);
        if (chunk === null) {
          process.stdin.once('readable', readBody);
          return;
        }

        chunk.copy(messageBuffer, bodyBytesRead);
        bodyBytesRead += chunk.length;

        if (bodyBytesRead === length) {
          try {
            const message = JSON.parse(messageBuffer.toString('utf8'));
            resolve(message);
          } catch (error) {
            reject(error);
          }
        } else {
          readBody();
        }
      };

      readBody();
    };

    readLength();
  });
}

function writeMessage(message) {
  const messageString = JSON.stringify(message);
  const messageBuffer = Buffer.from(messageString, 'utf8');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(messageBuffer.length, 0);

  process.stdout.write(lengthBuffer);
  process.stdout.write(messageBuffer);
}

// Log to stderr (stdout is used for protocol)
function log(message) {
  const timestamp = new Date().toISOString();
  process.stderr.write(`[${timestamp}] ${message}\n`);
}

async function main() {
  log('Native Messaging Host started');
  log(`Extension ID: ${EXTENSION_ID}`);

  // In a real implementation, we would:
  // 1. Connect to Chrome extension via chrome.runtime.connect()
  // 2. Forward messages between stdin/stdout and the extension
  // 3. Handle disconnection gracefully

  // For now, we'll implement a simple echo server
  // that demonstrates the protocol works

  try {
    while (true) {
      const message = await readMessage();
      log(`Received message: ${JSON.stringify(message)}`);

      // Forward to extension (TODO: Implement actual extension communication)
      // For now, echo back with a response
      const response = {
        jsonrpc: '2.0',
        id: message.id,
        result: {
          message: 'Native messaging host received message',
          original: message
        }
      };

      writeMessage(response);
      log(`Sent response: ${JSON.stringify(response)}`);
    }
  } catch (error) {
    log(`Error: ${error.message}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log('Received SIGINT, shutting down gracefully');
  process.exit(0);
});

// Start the host
main().catch((error) => {
  log(`Fatal error: ${error.message}`);
  process.exit(1);
});

