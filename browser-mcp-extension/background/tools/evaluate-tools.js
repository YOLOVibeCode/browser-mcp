/**
 * Evaluate Tools - JavaScript execution in page context
 * Pure JavaScript - Chrome Extension compatible
 */

/**
 * Create evaluateCode tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createEvaluateCodeTool(tabManager, cdp) {
  return {
    name: 'evaluateCode',
    description: 'Execute JavaScript code in a browser tab',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string', description: 'URL pattern to match' },
        expression: { type: 'string', description: 'JavaScript expression to evaluate' },
        returnByValue: { type: 'boolean', description: 'Return result by value (default: true)' }
      },
      required: ['expression']
    },
    
    execute: async (params) => {
      const { urlPattern, expression, returnByValue = true } = params;
      
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
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue
            });
            
            if (result.exceptionDetails) {
              return {
                tabId: tab.tabId,
                url: tab.url,
                error: result.exceptionDetails.text || 'Evaluation failed',
                exception: result.exceptionDetails
              };
            }
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              result: result.result.value,
              type: result.result.type
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
 * Create getPageTitle tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetPageTitleTool(tabManager, cdp) {
  return {
    name: 'getPageTitle',
    description: 'Get the page title from a browser tab',
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
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression: 'document.title',
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              title: result.result.value
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

