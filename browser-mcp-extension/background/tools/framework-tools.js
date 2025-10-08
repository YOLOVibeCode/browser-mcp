/**
 * Framework Tools - Framework detection and analysis
 * Pure JavaScript - Chrome Extension compatible
 */

/**
 * Create detectFramework tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createDetectFrameworkTool(tabManager, cdp) {
  return {
    name: 'detectFramework',
    description: 'Detect JavaScript framework used in the page',
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
                const frameworks = [];
                if (window.React) frameworks.push({ name: 'React', version: window.React.version });
                if (window.Vue) frameworks.push({ name: 'Vue', version: window.Vue.version });
                if (window.Angular) frameworks.push({ name: 'Angular', detected: true });
                if (window.Svelte) frameworks.push({ name: 'Svelte', detected: true });
                if (window.jQuery) frameworks.push({ name: 'jQuery', version: window.jQuery.fn.jquery });
                
                // Check for framework-specific attributes
                if (document.querySelector('[data-react-root], [data-reactroot]')) {
                  frameworks.push({ name: 'React', detected: 'via DOM' });
                }
                if (document.querySelector('[data-v-app]')) {
                  frameworks.push({ name: 'Vue', detected: 'via DOM' });
                }
                if (document.querySelector('[ng-version]')) {
                  frameworks.push({ name: 'Angular', detected: 'via DOM' });
                }
                
                return frameworks.length > 0 ? frameworks : [{ name: 'None detected' }];
              })()
            `;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              frameworks: result.result.value
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
 * Create getComponentSource tool (simplified)
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetComponentSourceTool(tabManager, cdp) {
  return {
    name: 'getComponentSource',
    description: 'Get component information for an element (framework-aware)',
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
                
                // Try to get React Fiber
                const fiberKey = Object.keys(el).find(key => key.startsWith('__reactFiber'));
                if (fiberKey) {
                  const fiber = el[fiberKey];
                  return {
                    framework: 'React',
                    componentName: fiber.type?.name || fiber.elementType?.name || 'Unknown',
                    props: Object.keys(fiber.memoizedProps || {}),
                    state: fiber.memoizedState ? 'Has state' : 'No state'
                  };
                }
                
                // Try Vue
                if (el.__vue__) {
                  return {
                    framework: 'Vue',
                    componentName: el.__vue__.$options.name || 'Unknown',
                    hasData: !!el.__vue__._data
                  };
                }
                
                return {
                  framework: 'None detected',
                  element: {
                    tag: el.tagName,
                    id: el.id,
                    class: el.className
                  }
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
              selector,
              component: result.result.value
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
 * Create getComponentTree tool (simplified)
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetComponentTreeTool(tabManager, cdp) {
  return {
    name: 'getComponentTree',
    description: 'Get component tree structure',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        maxDepth: { type: 'number', description: 'Maximum depth to traverse (default: 5)' }
      }
    },
    
    execute: async (params) => {
      const { urlPattern, maxDepth = 5 } = params;
      
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
                const tree = [];
                const rootEl = document.querySelector('[data-react-root], [data-reactroot], [id="root"], [id="app"]');
                if (!rootEl) return { error: 'No root element found' };
                
                function traverse(el, depth) {
                  if (depth > ${maxDepth}) return null;
                  const fiberKey = Object.keys(el).find(key => key.startsWith('__reactFiber'));
                  if (fiberKey) {
                    const fiber = el[fiberKey];
                    return {
                      type: fiber.type?.name || fiber.elementType?.name || el.tagName,
                      depth,
                      children: Array.from(el.children).map(child => traverse(child, depth + 1)).filter(Boolean)
                    };
                  }
                  return {
                    type: el.tagName,
                    depth,
                    children: Array.from(el.children).slice(0, 3).map(child => traverse(child, depth + 1)).filter(Boolean)
                  };
                }
                
                return traverse(rootEl, 0);
              })()
            `;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              tree: result.result.value
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

