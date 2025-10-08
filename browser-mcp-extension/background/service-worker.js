/**
 * Browser MCP v3.0 - Service Worker
 * Pure JavaScript - Chrome Extension compatible
 * 
 * This is the main entry point for the Chrome extension.
 * It initializes the MCP server, registers all tools, and handles communication.
 */

import { MCPServer } from './mcp-server.js';
import { TabManager } from './tab-manager.js';
import { ChromeCDP } from './adapters/chrome-cdp.js';
import { NativeMessaging } from './adapters/native-messaging.js';
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

console.log('[Browser MCP] Service worker starting...');

// Initialize core components
const mcpServer = new MCPServer();
const tabManager = new TabManager();
const cdp = new ChromeCDP();
const nativeMessaging = new NativeMessaging(chrome, { autoReconnect: true });

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
mcpServer.registerTool(createGetAllStorageTool(tabManager, cdp));
mcpServer.registerTool(createGetLocalStorageTool(tabManager, cdp));
mcpServer.registerTool(createGetSessionStorageTool(tabManager, cdp));
mcpServer.registerTool(createGetIndexedDBTool(tabManager, cdp));
mcpServer.registerTool(createGetCookiesTool(tabManager, cdp));

// DOM Query tools (4)
mcpServer.registerTool(createQueryDOMTool(tabManager, cdp));
mcpServer.registerTool(createFindByTextTool(tabManager, cdp));
mcpServer.registerTool(createGetSiblingsTool(tabManager, cdp));
mcpServer.registerTool(createGetParentsTool(tabManager, cdp));

// Framework tools (3)
mcpServer.registerTool(createDetectFrameworkTool(tabManager, cdp));
mcpServer.registerTool(createGetComponentSourceTool(tabManager, cdp));
mcpServer.registerTool(createGetComponentTreeTool(tabManager, cdp));

// Debug State tools (3)
mcpServer.registerTool(createGetComponentStateTool(tabManager, cdp));
mcpServer.registerTool(createGetRenderChainTool(tabManager, cdp));
mcpServer.registerTool(createTraceDataSourcesTool(tabManager, cdp));

// Source Map tools (4)
mcpServer.registerTool(createListScriptsTool(tabManager, cdp));
mcpServer.registerTool(createGetSourceMapTool(tabManager, cdp));
mcpServer.registerTool(createCompareSourceTool(tabManager, cdp));
mcpServer.registerTool(createResolveSourceLocationTool(tabManager, cdp));

console.log(`[Browser MCP] Registered ${mcpServer.getToolCount()} tools ✅`);

// Start MCP server
mcpServer.start();

// Track Chrome tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log(`[Browser MCP] Tab updated: ${tabId} - ${tab.url}`);
    tabManager.registerTab(tabId, tab.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  console.log(`[Browser MCP] Tab removed: ${tabId}`);
  tabManager.unregisterTab(tabId);
  cdp.detach(tabId).catch(err => console.warn(`Failed to detach from tab ${tabId}:`, err));
});

// Get existing tabs on startup
chrome.tabs.query({}, (tabs) => {
  for (const tab of tabs) {
    if (tab.url) {
      tabManager.registerTab(tab.id, tab.url);
    }
  }
  console.log(`[Browser MCP] Tracking ${tabManager.getAllTabs().length} tabs`);
});

// Native Messaging Communication
/**
 * Connect to native messaging host
 */
async function connectNativeHost() {
  try {
    await nativeMessaging.connect('com.browser_mcp.host');
    
    // Handle incoming messages from IDE
    nativeMessaging.onMessage(async (message) => {
      console.log('[Browser MCP] Received message from IDE:', message);
      
      try {
        // Handle MCP request
        const response = await mcpServer.handleRequest(message);
        
        // Send response back to IDE
        await nativeMessaging.sendMessage(response);
      } catch (error) {
        console.error('[Browser MCP] Error handling request:', error);
        
        // Send error response
        await nativeMessaging.sendMessage({
          jsonrpc: '2.0',
          id: message.id || null,
          error: {
            code: -32603,
            message: 'Internal error',
            data: error.message
          }
        });
      }
    });
    
    // Handle disconnect
    nativeMessaging.onDisconnect(() => {
      console.log('[Browser MCP] Native host disconnected');
      chrome.action.setBadgeText({ text: '?' });
      chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });
    });
    
    console.log('[Browser MCP] Connected to native host');
    
    // Update extension icon to show connected state
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    
  } catch (error) {
    console.error('[Browser MCP] Failed to connect to native host:', error);
    console.log('[Browser MCP] Extension will still work via popup UI');
    
    // Update extension icon to show disconnected state
    chrome.action.setBadgeText({ text: '?' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF9800' });
  }
}

// Connect to native host on startup
connectNativeHost();

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Browser MCP] Extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Open welcome page or setup guide
    chrome.tabs.create({
      url: chrome.runtime.getURL('popup/popup.html')
    });
  }
});

// Handle extension icon click (for testing without IDE)
chrome.action.onClicked.addListener(async (tab) => {
  console.log('[Browser MCP] Extension icon clicked');
  
  // Open popup (this won't fire if popup is defined in manifest, but keeping for reference)
  // chrome.action.openPopup();
});

// Message handler for popup/content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Browser MCP] Runtime message received:', message);
  
  if (message.type === 'GET_STATUS') {
    sendResponse({
      connected: nativeMessaging.isConnected(),
      toolCount: mcpServer.getToolCount(),
      tabCount: tabManager.getAllTabs().length,
      tabs: tabManager.getAllTabs(),
      tools: mcpServer.getToolNames()
    });
    return true;
  }
  
  if (message.type === 'TEST_TOOL') {
    // Test a tool from popup
    mcpServer.handleRequest({
      jsonrpc: '2.0',
      id: 1,
      method: message.method,
      params: message.params
    }).then(response => {
      sendResponse(response);
    }).catch(error => {
      sendResponse({
        jsonrpc: '2.0',
        id: 1,
        error: {
          code: -32603,
          message: error.message
        }
      });
    });
    return true;
  }
});

console.log('[Browser MCP] Service worker initialized successfully!');
console.log('[Browser MCP] Ready to debug! 🚀');

// Export for testing
export { mcpServer, tabManager, cdp, nativeMessaging };

