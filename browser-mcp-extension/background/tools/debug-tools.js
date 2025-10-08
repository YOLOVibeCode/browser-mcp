/**
 * Debug State Tools - Component state inspection
 * Pure JavaScript - Chrome Extension compatible
 */

/**
 * Create getComponentState tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetComponentStateTool(tabManager, cdp) {
  return {
    name: 'getComponentState',
    description: 'Get component state for debugging',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        selector: { type: 'string', description: 'CSS selector for component element' }
      },
      required: ['selector']
    },
    
    execute: async (params) => {
      const { urlPattern, selector } = params;
      
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
                const el = document.querySelector('${selector}');
                if (!el) return { error: 'Element not found' };
                
                // React Fiber
                const fiberKey = Object.keys(el).find(key => key.startsWith('__reactFiber'));
                if (fiberKey) {
                  const fiber = el[fiberKey];
                  return {
                    framework: 'React',
                    props: fiber.memoizedProps,
                    state: fiber.memoizedState,
                    type: fiber.type?.name || 'Unknown'
                  };
                }
                
                // Vue
                if (el.__vue__) {
                  return {
                    framework: 'Vue',
                    data: el.__vue__._data,
                    props: el.__vue__.$props
                  };
                }
                
                return { error: 'No framework detected' };
              })()
            `;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              selector,
              state: result.result.value
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
 * Create getRenderChain tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetRenderChainTool(tabManager, cdp) {
  return {
    name: 'getRenderChain',
    description: 'Get the render chain/component hierarchy',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        selector: { type: 'string', description: 'CSS selector' }
      },
      required: ['selector']
    },
    
    execute: async (params) => {
      const { urlPattern, selector } = params;
      
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
                const el = document.querySelector('${selector}');
                if (!el) return { error: 'Element not found' };
                
                const chain = [];
                let current = el;
                
                while (current) {
                  const fiberKey = Object.keys(current).find(key => key.startsWith('__reactFiber'));
                  if (fiberKey) {
                    const fiber = current[fiberKey];
                    chain.push({
                      component: fiber.type?.name || fiber.elementType?.name || current.tagName,
                      element: current.tagName
                    });
                  } else {
                    chain.push({
                      element: current.tagName,
                      id: current.id,
                      class: current.className
                    });
                  }
                  current = current.parentElement;
                  if (chain.length > 20) break; // Prevent infinite loops
                }
                
                return chain;
              })()
            `;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              selector,
              chain: result.result.value
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
 * Create traceDataSources tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createTraceDataSourcesTool(tabManager, cdp) {
  return {
    name: 'traceDataSources',
    description: 'Trace data sources for a component',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        selector: { type: 'string', description: 'CSS selector' }
      },
      required: ['selector']
    },
    
    execute: async (params) => {
      const { urlPattern, selector } = params;
      
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
                const el = document.querySelector('${selector}');
                if (!el) return { error: 'Element not found' };
                
                const sources = [];
                const fiberKey = Object.keys(el).find(key => key.startsWith('__reactFiber'));
                
                if (fiberKey) {
                  const fiber = el[fiberKey];
                  const props = fiber.memoizedProps || {};
                  const state = fiber.memoizedState;
                  
                  sources.push({
                    type: 'props',
                    keys: Object.keys(props),
                    count: Object.keys(props).length
                  });
                  
                  if (state) {
                    sources.push({
                      type: 'state',
                      hasState: true
                    });
                  }
                  
                  // Check for context
                  if (fiber.dependencies) {
                    sources.push({
                      type: 'context',
                      detected: true
                    });
                  }
                }
                
                // Check for Redux
                if (window.__REDUX_DEVTOOLS_EXTENSION__) {
                  sources.push({ type: 'Redux', detected: true });
                }
                
                // Check for localStorage
                if (localStorage.length > 0) {
                  sources.push({ 
                    type: 'localStorage', 
                    keys: Object.keys(localStorage).length 
                  });
                }
                
                return sources;
              })()
            `;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              selector,
              dataSources: result.result.value
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

