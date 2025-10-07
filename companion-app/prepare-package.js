#!/usr/bin/env node

/**
 * Prepare Package Script
 *
 * This script runs before npm publish to copy the MCP server files
 * into the companion-app package so they're included in the published package.
 */

import { cpSync, existsSync, mkdirSync, rmSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const MCP_SERVER_SOURCE = join(__dirname, '..', 'mcp-server', 'dist');
const MCP_SERVER_DEST = join(__dirname, 'mcp-server', 'dist');
const MCP_SERVER_PKG_SOURCE = join(__dirname, '..', 'mcp-server', 'package.json');
const MCP_SERVER_PKG_DEST = join(__dirname, 'mcp-server', 'package.json');

console.log('📦 Preparing companion-app package...');
console.log('');

// Check if MCP server is built
if (!existsSync(MCP_SERVER_SOURCE)) {
  console.error('❌ Error: MCP server not built!');
  console.error('   Run: npm run build');
  console.error('   Source: ' + MCP_SERVER_SOURCE);
  process.exit(1);
}

// Clean destination
if (existsSync(join(__dirname, 'mcp-server'))) {
  console.log('→ Cleaning old files...');
  rmSync(join(__dirname, 'mcp-server'), { recursive: true, force: true });
}

// Create directories
console.log('→ Creating directories...');
mkdirSync(join(__dirname, 'mcp-server', 'dist'), { recursive: true });

// Copy MCP server files
console.log('→ Copying MCP server files...');
cpSync(MCP_SERVER_SOURCE, MCP_SERVER_DEST, { recursive: true });
cpSync(MCP_SERVER_PKG_SOURCE, MCP_SERVER_PKG_DEST);

console.log('✓ Package prepared successfully');
console.log('');
console.log('Included files:');
console.log('  - companion-app/index.js');
console.log('  - companion-app/mcp-server/dist/');
console.log('  - companion-app/mcp-server/package.json');
console.log('');
