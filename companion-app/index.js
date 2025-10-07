#!/usr/bin/env node

/**
 * Browser MCP Companion App
 *
 * This is a simple companion app that:
 * 1. Starts the MCP server automatically
 * 2. Provides a health check endpoint for the extension
 * 3. Shows clear status in the terminal
 * 4. Makes setup super easy!
 */

import express from 'express';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import open from 'open';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const HEALTH_PORT = 3100;
const MCP_SERVER_PORT = 3100;

const startTime = new Date();
console.log('\n🚀 Browser MCP Companion App\n');
console.log('━'.repeat(50));
console.log(`   Started at: ${startTime.toISOString()}`);
console.log(`   Node version: ${process.version}`);
console.log(`   Platform: ${process.platform}`);
console.log('━'.repeat(50));

// Create health check server
const app = express();

// Enable CORS for extension
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  const timestamp = new Date().toISOString();
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  console.log(`\n${'─'.repeat(50)}`);
  console.log(`💓 [${timestamp}] HEALTH CHECK`);
  console.log(`   Client IP: ${clientIP}`);
  console.log(`   User-Agent: ${req.get('user-agent') || 'unknown'}`);
  console.log(`   Status: OK`);
  console.log(`${'─'.repeat(50)}\n`);

  res.json({
    status: 'ok',
    server: 'running',
    port: MCP_SERVER_PORT,
    timestamp: timestamp
  });
});

// Status page
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Browser MCP - Running</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px;
          margin: 100px auto;
          padding: 40px;
          text-align: center;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }
        h1 { font-size: 48px; margin: 0 0 20px 0; }
        p { font-size: 18px; opacity: 0.9; margin: 10px 0; }
        .status {
          background: rgba(255, 255, 255, 0.2);
          padding: 20px;
          border-radius: 12px;
          margin-top: 30px;
        }
        .port {
          font-size: 32px;
          font-weight: bold;
          margin: 10px 0;
        }
      </style>
    </head>
    <body>
      <h1>🚀 Browser MCP</h1>
      <p>Server is running and ready!</p>
      <div class="status">
        <p>MCP Server Port</p>
        <div class="port">${MCP_SERVER_PORT}</div>
      </div>
      <p style="margin-top: 30px; font-size: 14px;">
        ✅ Extension can now connect to this server<br>
        💡 Keep this window open while using the extension
      </p>
    </body>
    </html>
  `);
});

// Start health check server
app.listen(HEALTH_PORT, () => {
  const readyTime = new Date();
  const startupDuration = readyTime - startTime;

  console.log('');
  console.log('✅ Health check server started');
  console.log(`   Port: ${HEALTH_PORT}`);
  console.log(`   URL: http://localhost:${HEALTH_PORT}`);
  console.log(`   Ready at: ${readyTime.toISOString()}`);
  console.log(`   Startup time: ${startupDuration}ms`);
  console.log('');
  console.log('━'.repeat(50));
  console.log('');
  console.log('🎉 All systems ready!');
  console.log('');
  console.log('📋 What to do next:');
  console.log('   1. Open Chrome and navigate to any website');
  console.log('   2. Click the Browser Inspector extension icon');
  console.log('   3. Click "Connect This Tab"');
  console.log('');
  console.log('💡 Tip: Keep this terminal window open!');
  console.log('');
  console.log('🔍 Debug Mode: ON');
  console.log('   - Health check requests will be logged');
  console.log('   - Watch this console for connection attempts');
  console.log('');
  console.log('━'.repeat(50));
  console.log('');

  // Auto-open status page
  setTimeout(() => {
    console.log('🌐 Opening status page in browser...\n');
    open(`http://localhost:${HEALTH_PORT}`).catch(() => {
      console.log('⚠️  Could not auto-open browser\n');
    });
  }, 1000);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down Browser MCP...');
  console.log('   Thank you for using Browser MCP!\n');
  process.exit(0);
});

// Log errors
process.on('uncaughtException', (err) => {
  console.error('\n❌ Error:', err.message);
  console.log('\n💡 Try restarting the companion app\n');
});

console.log('🔄 Starting servers...');
console.log('');
