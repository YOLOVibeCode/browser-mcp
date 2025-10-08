/**
 * Tab Tools - Tab management
 * Pure JavaScript - Chrome Extension compatible
 */

/**
 * Create listTabs tool
 * @param {ITabManager} tabManager 
 * @returns {IMCPTool}
 */
export function createListTabsTool(tabManager) {
  return {
    name: 'listTabs',
    description: 'List all open browser tabs',
    inputSchema: {
      type: 'object',
      properties: {
        filter: { type: 'string', description: 'Optional: filter tabs by URL pattern' }
      }
    },
    
    execute: async (params) => {
      const { filter } = params;
      
      let tabs = tabManager.getAllTabs();
      
      if (filter) {
        tabs = tabManager.findTabs(filter);
      }

      return {
        tabs: tabs.map(t => ({
          tabId: t.tabId,
          url: t.url,
          registeredAt: t.registeredAt
        })),
        totalCount: tabs.length
      };
    }
  };
}

/**
 * Create getTabInfo tool
 * @param {ITabManager} tabManager 
 * @returns {IMCPTool}
 */
export function createGetTabInfoTool(tabManager) {
  return {
    name: 'getTabInfo',
    description: 'Get detailed information about a specific tab',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string', description: 'URL pattern to match' }
      },
      required: ['urlPattern']
    },
    
    execute: async (params) => {
      const { urlPattern } = params;
      
      const tabs = tabManager.findTabs(urlPattern);

      if (tabs.length === 0) {
        return {
          error: `No tabs found matching: "${urlPattern}"`,
          availableTabs: tabManager.getAllTabs().map(t => t.url)
        };
      }

      return {
        tabs: tabs.map(t => ({
          tabId: t.tabId,
          url: t.url,
          registeredAt: t.registeredAt
        }))
      };
    }
  };
}

