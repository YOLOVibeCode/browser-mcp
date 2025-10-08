/**
 * Console Tools - Browser console inspection
 * Pure JavaScript - Chrome Extension compatible
 */

/**
 * Create getConsole tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetConsoleTool(tabManager, cdp) {
  return {
    name: 'getConsole',
    description: 'Get console messages from a browser tab',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: {
          type: 'string',
          description: 'URL pattern to match (e.g., "localhost:3000")'
        },
        types: {
          type: 'array',
          items: { type: 'string' },
          description: 'Message types to filter (log, warn, error, info, debug)'
        }
      }
    },
    
    execute: async (params) => {
      const { urlPattern, types } = params;
      
      // Find matching tabs
      const tabs = urlPattern 
        ? tabManager.findTabs(urlPattern)
        : tabManager.getAllTabs();

      if (tabs.length === 0) {
        return {
          error: `No tabs found matching: "${urlPattern}"`,
          availableTabs: tabManager.getAllTabs().map(t => t.url)
        };
      }

      // Get console messages from each tab
      const results = await Promise.all(
        tabs.map(async (tab) => {
          try {
            // Enable Runtime domain
            await cdp.sendCommand(tab.tabId, 'Runtime.enable', {});
            
            // Enable Console domain  
            await cdp.sendCommand(tab.tabId, 'Console.enable', {});
            
            // Get console messages (note: this gets cached messages, for real-time use event listeners)
            const messages = [];
            
            // For now, we'll use evaluateCode to get console history from page
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression: `
                (function() {
                  if (window.__browserMCPConsoleHistory) {
                    return window.__browserMCPConsoleHistory;
                  }
                  return [];
                })()
              `,
              returnByValue: true
            });
            
            const consoleHistory = result?.result?.value || [];
            
            // Filter by type if specified
            const filteredMessages = types && types.length > 0
              ? consoleHistory.filter(msg => types.includes(msg.type))
              : consoleHistory;

            return {
              tabId: tab.tabId,
              url: tab.url,
              messages: filteredMessages,
              messageCount: filteredMessages.length
            };
          } catch (error) {
            return {
              tabId: tab.tabId,
              url: tab.url,
              error: error.message,
              messages: []
            };
          }
        })
      );

      return {
        tabs: results,
        totalTabs: tabs.length,
        totalMessages: results.reduce((sum, r) => sum + r.messageCount, 0)
      };
    }
  };
}

/**
 * Create clearConsole tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createClearConsoleTool(tabManager, cdp) {
  return {
    name: 'clearConsole',
    description: 'Clear console messages from a browser tab',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: {
          type: 'string',
          description: 'URL pattern to match (e.g., "localhost:3000")'
        }
      }
    },
    
    execute: async (params) => {
      const { urlPattern } = params;
      
      const tabs = urlPattern 
        ? tabManager.findTabs(urlPattern)
        : tabManager.getAllTabs();

      if (tabs.length === 0) {
        return {
          error: `No tabs found matching: "${urlPattern}"`,
          availableTabs: tabManager.getAllTabs().map(t => t.url)
        };
      }

      const results = await Promise.all(
        tabs.map(async (tab) => {
          try {
            // Clear console via Runtime.evaluate
            await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression: 'console.clear(); if (window.__browserMCPConsoleHistory) window.__browserMCPConsoleHistory = [];'
            });

            return {
              tabId: tab.tabId,
              url: tab.url,
              success: true
            };
          } catch (error) {
            return {
              tabId: tab.tabId,
              url: tab.url,
              success: false,
              error: error.message
            };
          }
        })
      );

      return {
        tabs: results,
        clearedTabs: results.filter(r => r.success).length,
        totalTabs: tabs.length
      };
    }
  };
}

