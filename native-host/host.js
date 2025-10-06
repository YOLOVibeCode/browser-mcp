#!/usr/bin/env node

/**
 * Browser MCP Native Messaging Host
 *
 * This native host allows the Chrome extension to write config files
 * to any location on the filesystem (e.g., ~/.cursor/mcp.json, etc.)
 *
 * Native Messaging Protocol:
 * - Messages are length-prefixed JSON over stdin/stdout
 * - First 4 bytes = message length (uint32, little-endian)
 * - Followed by JSON message
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Read a message from stdin (Chrome extension)
 */
function readMessage() {
  return new Promise((resolve, reject) => {
    const lengthBuffer = Buffer.alloc(4);
    let bytesRead = 0;

    const readLength = () => {
      const chunk = process.stdin.read(4 - bytesRead);
      if (chunk === null) {
        // Wait for more data
        return;
      }

      chunk.copy(lengthBuffer, bytesRead);
      bytesRead += chunk.length;

      if (bytesRead === 4) {
        const messageLength = lengthBuffer.readUInt32LE(0);
        readMessageBody(messageLength);
      }
    };

    const readMessageBody = (length) => {
      const messageBuffer = Buffer.alloc(length);
      let messageRead = 0;

      const readBody = () => {
        const chunk = process.stdin.read(length - messageRead);
        if (chunk === null) {
          return;
        }

        chunk.copy(messageBuffer, messageRead);
        messageRead += chunk.length;

        if (messageRead === length) {
          try {
            const message = JSON.parse(messageBuffer.toString('utf8'));
            resolve(message);
          } catch (err) {
            reject(err);
          }
          process.stdin.removeListener('readable', readBody);
        }
      };

      process.stdin.on('readable', readBody);
      readBody();
    };

    process.stdin.on('readable', readLength);
    readLength();
  });
}

/**
 * Send a message to stdout (Chrome extension)
 */
function sendMessage(message) {
  const json = JSON.stringify(message);
  const buffer = Buffer.from(json, 'utf8');
  const lengthBuffer = Buffer.alloc(4);
  lengthBuffer.writeUInt32LE(buffer.length, 0);

  process.stdout.write(lengthBuffer);
  process.stdout.write(buffer);
}

/**
 * Expand ~ to home directory
 */
function expandPath(filePath) {
  if (filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }

  // Handle %APPDATA% and %USERPROFILE% on Windows
  if (process.platform === 'win32') {
    filePath = filePath.replace(/%APPDATA%/g, process.env.APPDATA || '');
    filePath = filePath.replace(/%USERPROFILE%/g, process.env.USERPROFILE || '');
  }

  return filePath;
}

/**
 * Ensure directory exists
 */
function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/**
 * Merge configuration with existing file
 */
function mergeConfig(filePath, newConfig) {
  let existing = {};

  if (fs.existsSync(filePath)) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      existing = JSON.parse(content);
    } catch (err) {
      // If file exists but is invalid JSON, backup and start fresh
      const backup = `${filePath}.backup.${Date.now()}`;
      fs.copyFileSync(filePath, backup);
      sendMessage({
        success: true,
        warning: `Existing file had invalid JSON. Backed up to ${backup}`
      });
    }
  }

  // Merge mcpServers
  if (!existing.mcpServers) {
    existing.mcpServers = {};
  }

  // Add or update browser-inspector
  Object.assign(existing.mcpServers, newConfig.mcpServers);

  return existing;
}

/**
 * Handle write config request
 */
async function handleWriteConfig(request) {
  try {
    const { path: filePath, content, merge = true } = request;

    if (!filePath || !content) {
      return {
        success: false,
        error: 'Missing path or content'
      };
    }

    // Expand path
    const expandedPath = expandPath(filePath);

    // Ensure directory exists
    ensureDir(expandedPath);

    // Parse new config
    const newConfig = typeof content === 'string' ? JSON.parse(content) : content;

    // Merge with existing if requested
    const finalConfig = merge ? mergeConfig(expandedPath, newConfig) : newConfig;

    // Write file
    fs.writeFileSync(expandedPath, JSON.stringify(finalConfig, null, 2), 'utf8');

    return {
      success: true,
      path: expandedPath,
      message: `Configuration written successfully to ${expandedPath}`
    };

  } catch (err) {
    return {
      success: false,
      error: err.message,
      stack: err.stack
    };
  }
}

/**
 * Handle read config request
 */
async function handleReadConfig(request) {
  try {
    const { path: filePath } = request;

    if (!filePath) {
      return {
        success: false,
        error: 'Missing path'
      };
    }

    const expandedPath = expandPath(filePath);

    if (!fs.existsSync(expandedPath)) {
      return {
        success: false,
        error: 'File does not exist',
        path: expandedPath
      };
    }

    const content = fs.readFileSync(expandedPath, 'utf8');
    const config = JSON.parse(content);

    return {
      success: true,
      path: expandedPath,
      content: config
    };

  } catch (err) {
    return {
      success: false,
      error: err.message,
      stack: err.stack
    };
  }
}

/**
 * Main message handler
 */
async function handleMessage(message) {
  const { type } = message;

  switch (type) {
    case 'WRITE_CONFIG':
      return await handleWriteConfig(message);

    case 'READ_CONFIG':
      return await handleReadConfig(message);

    case 'PING':
      return { success: true, message: 'pong' };

    default:
      return {
        success: false,
        error: `Unknown message type: ${type}`
      };
  }
}

/**
 * Main loop
 */
async function main() {
  try {
    // Read message from Chrome extension
    const message = await readMessage();

    // Handle message
    const response = await handleMessage(message);

    // Send response back to Chrome extension
    sendMessage(response);

  } catch (err) {
    sendMessage({
      success: false,
      error: err.message,
      stack: err.stack
    });
  }

  // Exit after handling one message (Chrome will restart us for next message)
  process.exit(0);
}

// Handle errors
process.on('uncaughtException', (err) => {
  sendMessage({
    success: false,
    error: `Uncaught exception: ${err.message}`,
    stack: err.stack
  });
  process.exit(1);
});

// Start the host
main();
