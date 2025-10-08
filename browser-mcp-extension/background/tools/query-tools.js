/**
 * DOM Query Tools - Advanced DOM querying (jQuery-style)
 * Pure JavaScript - Chrome Extension compatible
 */

/**
 * Create queryDOM tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createQueryDOMTool(tabManager, cdp) {
  return {
    name: 'queryDOM',
    description: 'Advanced DOM query with multiple selectors',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        selector: { type: 'string', description: 'CSS selector' },
        all: { type: 'boolean', description: 'Find all matches (default: true)' }
      },
      required: ['selector']
    },
    
    execute: async (params) => {
      const { urlPattern, selector, all = true } = params;
      
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
            
            const expression = all
              ? `Array.from(document.querySelectorAll('${selector}')).map(el => ({ 
                  tag: el.tagName, 
                  id: el.id, 
                  class: el.className, 
                  text: el.textContent.substring(0, 100) 
                }))`
              : `(() => {
                  const el = document.querySelector('${selector}');
                  return el ? { tag: el.tagName, id: el.id, class: el.className, text: el.textContent.substring(0, 100) } : null;
                })()`;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              selector,
              elements: result.result.value
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
 * Create findByText tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createFindByTextTool(tabManager, cdp) {
  return {
    name: 'findByText',
    description: 'Find elements by text content',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        text: { type: 'string', description: 'Text to search for' },
        exact: { type: 'boolean', description: 'Exact match (default: false)' }
      },
      required: ['text']
    },
    
    execute: async (params) => {
      const { urlPattern, text, exact = false } = params;
      
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
              Array.from(document.querySelectorAll('*')).filter(el => {
                const text = el.textContent.trim();
                return ${exact} 
                  ? text === '${text}'
                  : text.includes('${text}');
              }).map(el => ({
                tag: el.tagName,
                id: el.id,
                class: el.className,
                text: el.textContent.substring(0, 100)
              })).slice(0, 50)
            `;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              searchText: text,
              elements: result.result.value
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
 * Create getSiblings tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetSiblingsTool(tabManager, cdp) {
  return {
    name: 'getSiblings',
    description: 'Get sibling elements of a target element',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        selector: { type: 'string', description: 'CSS selector for target element' }
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
                if (!el || !el.parentElement) return null;
                return Array.from(el.parentElement.children)
                  .filter(sibling => sibling !== el)
                  .map(sibling => ({
                    tag: sibling.tagName,
                    id: sibling.id,
                    class: sibling.className
                  }));
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
              siblings: result.result.value
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
 * Create getParents tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetParentsTool(tabManager, cdp) {
  return {
    name: 'getParents',
    description: 'Get all parent elements up to document root',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        selector: { type: 'string', description: 'CSS selector for target element' }
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
                if (!el) return null;
                const parents = [];
                let current = el.parentElement;
                while (current) {
                  parents.push({
                    tag: current.tagName,
                    id: current.id,
                    class: current.className
                  });
                  current = current.parentElement;
                }
                return parents;
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
              parents: result.result.value
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

