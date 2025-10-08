/**
 * Storage Tools - Browser storage inspection
 * Pure JavaScript - Chrome Extension compatible
 */

/**
 * Create getAllStorage tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetAllStorageTool(tabManager, cdp) {
  return {
    name: 'getAllStorage',
    description: 'Get all storage data (localStorage, sessionStorage, cookies)',
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
            await cdp.sendCommand(tab.tabId, 'Runtime.enable', {});
            
            const expression = `
              (() => {
                return {
                  localStorage: Object.fromEntries(Object.entries(localStorage)),
                  sessionStorage: Object.fromEntries(Object.entries(sessionStorage)),
                  cookies: document.cookie
                };
              })()
            `;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              storage: result.result.value
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
 * Create getLocalStorage tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetLocalStorageTool(tabManager, cdp) {
  return {
    name: 'getLocalStorage',
    description: 'Get localStorage data',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        key: { type: 'string', description: 'Optional: specific key to fetch' }
      }
    },
    
    execute: async (params) => {
      const { urlPattern, key } = params;
      
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
            await cdp.sendCommand(tab.tabId, 'Runtime.enable', {});
            
            const expression = key
              ? `localStorage.getItem('${key}')`
              : `Object.fromEntries(Object.entries(localStorage))`;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              key,
              data: result.result.value
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
 * Create getSessionStorage tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetSessionStorageTool(tabManager, cdp) {
  return {
    name: 'getSessionStorage',
    description: 'Get sessionStorage data',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        key: { type: 'string', description: 'Optional: specific key to fetch' }
      }
    },
    
    execute: async (params) => {
      const { urlPattern, key } = params;
      
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
            await cdp.sendCommand(tab.tabId, 'Runtime.enable', {});
            
            const expression = key
              ? `sessionStorage.getItem('${key}')`
              : `Object.fromEntries(Object.entries(sessionStorage))`;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              key,
              data: result.result.value
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
 * Create getIndexedDB tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetIndexedDBTool(tabManager, cdp) {
  return {
    name: 'getIndexedDB',
    description: 'Get IndexedDB database information',
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
            await cdp.sendCommand(tab.tabId, 'Runtime.enable', {});
            
            const expression = `
              (async () => {
                const dbs = await indexedDB.databases();
                return dbs.map(db => ({ name: db.name, version: db.version }));
              })()
            `;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              awaitPromise: true,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              databases: result.result.value
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
 * Create getCookies tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetCookiesTool(tabManager, cdp) {
  return {
    name: 'getCookies',
    description: 'Get browser cookies for the page',
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
            await cdp.sendCommand(tab.tabId, 'Runtime.enable', {});
            
            const expression = `
              (() => {
                const cookies = document.cookie.split(';').map(c => {
                  const [name, ...value] = c.trim().split('=');
                  return { name, value: value.join('=') };
                });
                return cookies;
              })()
            `;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              cookies: result.result.value
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

