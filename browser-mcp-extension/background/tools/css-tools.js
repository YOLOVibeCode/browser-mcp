/**
 * CSS Tools - CSS inspection and analysis
 * Pure JavaScript - Chrome Extension compatible
 */

/**
 * Create getCSSStyles tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetCSSStylesTool(tabManager, cdp) {
  return {
    name: 'getCSSStyles',
    description: 'Get computed CSS styles for an element',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string', description: 'URL pattern to match' },
        selector: { type: 'string', description: 'CSS selector for the element' },
        properties: { 
          type: 'array', 
          items: { type: 'string' },
          description: 'Specific CSS properties to fetch (optional, returns all if not specified)'
        }
      },
      required: ['selector']
    },
    
    execute: async (params) => {
      const { urlPattern, selector, properties } = params;
      
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
            
            // Build expression to get computed styles
            const propsToFetch = properties && properties.length > 0
              ? `[${properties.map(p => `'${p}'`).join(',')}]`
              : 'null';
            
            const expression = `
              (() => {
                const el = document.querySelector('${selector}');
                if (!el) return { error: 'Element not found' };
                const styles = window.getComputedStyle(el);
                const props = ${propsToFetch};
                if (props) {
                  const result = {};
                  props.forEach(p => result[p] = styles[p]);
                  return result;
                }
                return Object.fromEntries(
                  Array.from(styles).map(key => [key, styles[key]])
                );
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
              styles: result.result.value
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
 * Create findCSSRule tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createFindCSSRuleTool(tabManager, cdp) {
  return {
    name: 'findCSSRule',
    description: 'Find CSS rules that apply to an element',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        selector: { type: 'string', description: 'CSS selector' },
        property: { type: 'string', description: 'Optional: specific CSS property to find' }
      },
      required: ['selector']
    },
    
    execute: async (params) => {
      const { urlPattern, selector, property } = params;
      
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
            await cdp.sendCommand(tab.tabId, 'CSS.enable', {});
            
            // Get matched styles for element
            const expression = `document.querySelector('${selector}')`;
            const evalResult = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression
            });
            
            if (!evalResult.result.objectId) {
              return {
                tabId: tab.tabId,
                url: tab.url,
                error: 'Element not found'
              };
            }
            
            // Get CSS rules
            const rulesExpression = `
              (() => {
                const el = document.querySelector('${selector}');
                if (!el) return [];
                const sheets = Array.from(document.styleSheets);
                const rules = [];
                sheets.forEach(sheet => {
                  try {
                    Array.from(sheet.cssRules || []).forEach(rule => {
                      if (rule.selectorText && el.matches(rule.selectorText)) {
                        rules.push({
                          selector: rule.selectorText,
                          cssText: rule.style.cssText,
                          source: sheet.href || 'inline'
                        });
                      }
                    });
                  } catch (e) {}
                });
                return rules;
              })()
            `;
            
            const rulesResult = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression: rulesExpression,
              returnByValue: true
            });
            
            let rules = rulesResult.result.value || [];
            
            // Filter by property if specified
            if (property) {
              rules = rules.filter(r => r.cssText.includes(property));
            }
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              selector,
              property,
              rules
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
 * Create getElementClasses tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetElementClassesTool(tabManager, cdp) {
  return {
    name: 'getElementClasses',
    description: 'Get all CSS classes applied to an element',
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
                return {
                  classes: Array.from(el.classList),
                  className: el.className,
                  id: el.id,
                  tagName: el.tagName.toLowerCase()
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
              ...result.result.value
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

