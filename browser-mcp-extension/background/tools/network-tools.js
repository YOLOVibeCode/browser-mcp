/**
 * Network Tools - Network inspection
 * Pure JavaScript - Chrome Extension compatible
 */

/**
 * Create getNetwork tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetNetworkTool(tabManager, cdp) {
  return {
    name: 'getNetwork',
    description: 'Get network requests from a browser tab',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string', description: 'URL pattern to match' },
        filter: { type: 'string', description: 'Filter requests by URL' }
      }
    },
    
    execute: async (params) => {
      const { urlPattern, filter } = params;
      
      const tabs = urlPattern 
        ? tabManager.findTabs(urlPattern)
        : tabManager.getAllTabs();

      if (tabs.length === 0) {
        return {
          error: `No tabs found`,
          availableTabs: tabManager.getAllTabs().map(t => t.url)
        };
      }

      const results = await Promise.all(
        tabs.map(async (tab) => {
          try {
            // Enable Network domain
            await cdp.sendCommand(tab.tabId, 'Network.enable', {});
            
            // Note: For real network monitoring, we'd need to listen to events
            // For now, return a structure showing how it would work
            return {
              tabId: tab.tabId,
              url: tab.url,
              note: 'Network monitoring requires event listeners. Use Chrome DevTools Network tab for now.',
              requests: []
            };
          } catch (error) {
            return {
              tabId: tab.tabId,
              url: tab.url,
              error: error.message
            };
          }
        })
      );

      return { tabs: results };
    }
  };
}

/**
 * Create getFailedRequests tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetFailedRequestsTool(tabManager, cdp) {
  return {
    name: 'getFailedRequests',
    description: 'Get failed network requests (4xx, 5xx) from a browser tab',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' }
      }
    },
    
    execute: async (params) => {
      const { urlPattern } = params;
      
      const tabs = urlPattern 
        ? tabManager.findTabs(urlPattern)
        : tabManager.getAllTabs();

      if (tabs.length === 0) {
        return {
          error: `No tabs found`,
          availableTabs: tabManager.getAllTabs().map(t => t.url)
        };
      }

      const results = await Promise.all(
        tabs.map(async (tab) => {
          try {
            await cdp.sendCommand(tab.tabId, 'Network.enable', {});
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              failedRequests: [],
              note: 'Network event monitoring requires persistent connection'
            };
          } catch (error) {
            return {
              tabId: tab.tabId,
              url: tab.url,
              error: error.message
            };
          }
        })
      );

      return { tabs: results };
    }
  };
}

