/**
 * Browser MCP v4.0 - Service Worker
 * Pure JavaScript - Chrome Extension compatible
 * WebSocket-based architecture
 *
 * This is the main entry point for the Chrome extension.
 * It initializes the WebSocket server, MCP server, registers all tools, and handles communication.
 */

import { MCPServer } from './mcp-server.js';
import { TabManager } from './tab-manager.js';
import { ChromeCDP } from './adapters/chrome-cdp.js';
import { WebSocketServer } from './websocket-server.js';
import { createGetConsoleTool, createClearConsoleTool } from './tools/console-tools.js';
import { createGetDOMTool, createQuerySelectorTool, createGetAttributesTool } from './tools/dom-tools.js';
import { createGetNetworkTool, createGetFailedRequestsTool } from './tools/network-tools.js';
import { createListTabsTool, createGetTabInfoTool } from './tools/tab-tools.js';
import { createEvaluateCodeTool, createGetPageTitleTool } from './tools/evaluate-tools.js';
import { createGetCSSStylesTool, createFindCSSRuleTool, createGetElementClassesTool } from './tools/css-tools.js';
import { createGetAllStorageTool, createGetLocalStorageTool, createGetSessionStorageTool, createGetIndexedDBTool, createGetCookiesTool } from './tools/storage-tools.js';
import { createQueryDOMTool, createFindByTextTool, createGetSiblingsTool, createGetParentsTool } from './tools/query-tools.js';
import { createDetectFrameworkTool, createGetComponentSourceTool, createGetComponentTreeTool } from './tools/framework-tools.js';
import { createGetComponentStateTool, createGetRenderChainTool, createTraceDataSourcesTool } from './tools/debug-tools.js';
import { createListScriptsTool, createGetSourceMapTool, createCompareSourceTool, createResolveSourceLocationTool } from './tools/sourcemap-tools.js';

console.log('[Browser MCP v4.0] Service worker starting...');

// Initialize core components
const mcpServer = new MCPServer();
const tabManager = new TabManager();
const cdp = new ChromeCDP();
const wsServer = new WebSocketServer({ port: 8765 });

// Register tools
console.log('[Browser MCP] Registering ALL 33 tools...');

// Console tools (2)
mcpServer.registerTool(createGetConsoleTool(tabManager, cdp));
mcpServer.registerTool(createClearConsoleTool(tabManager, cdp));

// DOM tools (3)
mcpServer.registerTool(createGetDOMTool(tabManager, cdp));
mcpServer.registerTool(createQuerySelectorTool(tabManager, cdp));
mcpServer.registerTool(createGetAttributesTool(tabManager, cdp));

// Network tools (2)
mcpServer.registerTool(createGetNetworkTool(tabManager, cdp));
mcpServer.registerTool(createGetFailedRequestsTool(tabManager, cdp));

// Tab tools (2)
mcpServer.registerTool(createListTabsTool(tabManager));
mcpServer.registerTool(createGetTabInfoTool(tabManager));

// Evaluate tools (2)
mcpServer.registerTool(createEvaluateCodeTool(tabManager, cdp));
mcpServer.registerTool(createGetPageTitleTool(tabManager, cdp));

// CSS tools (3)
mcpServer.registerTool(createGetCSSStylesTool(tabManager, cdp));
mcpServer.registerTool(createFindCSSRuleTool(tabManager, cdp));
mcpServer.registerTool(createGetElementClassesTool(tabManager, cdp));

// Storage tools (5)
mcpServer.registerTool(createGetAllStorageTool(tabManager));
mcpServer.registerTool(createGetLocalStorageTool(tabManager));
mcpServer.registerTool(createGetSessionStorageTool(tabManager));
mcpServer.registerTool(createGetIndexedDBTool(tabManager));
mcpServer.registerTool(createGetCookiesTool(tabManager));

// Query tools (4)
mcpServer.registerTool(createQueryDOMTool(tabManager, cdp));
mcpServer.registerTool(createFindByTextTool(tabManager, cdp));
mcpServer.registerTool(createGetSiblingsTool(tabManager, cdp));
mcpServer.registerTool(createGetParentsTool(tabManager, cdp));

// Framework tools (3)
mcpServer.registerTool(createDetectFrameworkTool(tabManager, cdp));
mcpServer.registerTool(createGetComponentSourceTool(tabManager, cdp));
mcpServer.registerTool(createGetComponentTreeTool(tabManager, cdp));

// Debug tools (3)
mcpServer.registerTool(createGetComponentStateTool(tabManager, cdp));
mcpServer.registerTool(createGetRenderChainTool(tabManager, cdp));
mcpServer.registerTool(createTraceDataSourcesTool(tabManager, cdp));

// Sourcemap tools (4)
mcpServer.registerTool(createListScriptsTool(tabManager, cdp));
mcpServer.registerTool(createGetSourceMapTool(tabManager, cdp));
mcpServer.registerTool(createCompareSourceTool(tabManager, cdp));
mcpServer.registerTool(createResolveSourceLocationTool(tabManager, cdp));

console.log(`[Browser MCP] Registered ${mcpServer.getToolCount()} tools:`, mcpServer.getToolNames());

// Setup WebSocket message handler
wsServer.onMessage(async (message, socketId) => {
  console.log('[Browser MCP] Received MCP request:', {
    method: message.method,
    id: message.id,
    from: `socket-${socketId}`
  });

  try {
    // Handle MCP request
    const response = await mcpServer.handleRequest(message);

    // Send response back via WebSocket
    wsServer.sendMessage(socketId, response);

    console.log('[Browser MCP] Sent MCP response:', {
      id: response.id,
      hasError: !!response.error
    });
  } catch (error) {
    console.error('[Browser MCP] Error handling request:', error);

    // Send error response
    const errorResponse = {
      jsonrpc: '2.0',
      id: message.id || null,
      error: {
        code: -32603,
        message: 'Internal error',
        data: error.message
      }
    };

    wsServer.sendMessage(socketId, errorResponse);
  }
});

// Start WebSocket server
async function startServer() {
  try {
    const port = await wsServer.start();
    console.log(`[Browser MCP] WebSocket server started on port ${port}`);
    console.log('[Browser MCP] Ready to accept connections from MCP server');
    console.log('[Browser MCP] Waiting for browser-mcp-server to connect...');

    // Start MCP server
    await mcpServer.start();
    console.log('[Browser MCP] MCP server initialized with 33 tools');
  } catch (error) {
    console.error('[Browser MCP] Failed to start server:', error);
  }
}

// Handle extension installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Browser MCP] Extension installed/updated:', details.reason);
  startServer();
});

// Start server on load
startServer();

// Keep service worker alive
setInterval(() => {
  console.log('[Browser MCP] Keepalive ping - Active connections:', wsServer.getConnectionCount());
}, 20000);

console.log('[Browser MCP] Service worker initialized successfully! 🚀');
