/**
 * Source Map Tools - Source mapping and code comparison
 * Pure JavaScript - Chrome Extension compatible
 */

/**
 * Create listScripts tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createListScriptsTool(tabManager, cdp) {
  return {
    name: 'listScripts',
    description: 'List all JavaScript files loaded in the page',
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
              Array.from(document.querySelectorAll('script[src]')).map(s => ({
                src: s.src,
                async: s.async,
                defer: s.defer,
                type: s.type
              }))
            `;
            
            const result = await cdp.sendCommand(tab.tabId, 'Runtime.evaluate', {
              expression,
              returnByValue: true
            });
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              scripts: result.result.value
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
 * Create getSourceMap tool (simplified)
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetSourceMapTool(tabManager, cdp) {
  return {
    name: 'getSourceMap',
    description: 'Get source map information for a script',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        scriptUrl: { type: 'string', description: 'Script URL to get source map for' }
      },
      required: ['scriptUrl']
    },
    
    execute: async (params) => {
      const { urlPattern, scriptUrl } = params;
      
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
                try {
                  const response = await fetch('${scriptUrl}');
                  const text = await response.text();
                  const mapMatch = text.match(/\\/\\/# sourceMappingURL=(.+)/);
                  return mapMatch ? { sourceMapUrl: mapMatch[1], found: true } : { found: false };
                } catch (e) {
                  return { error: e.message };
                }
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
              scriptUrl,
              sourceMap: result.result.value
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
 * Create compareSource tool (simplified)
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createCompareSourceTool(tabManager, cdp) {
  return {
    name: 'compareSource',
    description: 'Compare deployed code with local source',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        deployedUrl: { type: 'string', description: 'URL of deployed script' },
        localContent: { type: 'string', description: 'Local source content to compare' }
      },
      required: ['deployedUrl', 'localContent']
    },
    
    execute: async (params) => {
      const { urlPattern, deployedUrl, localContent } = params;
      
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
                try {
                  const response = await fetch('${deployedUrl}');
                  const deployed = await response.text();
                  const local = \`${localContent.replace(/`/g, '\\`')}\`;
                  
                  return {
                    deployed: { size: deployed.length, lines: deployed.split('\\n').length },
                    local: { size: local.length, lines: local.split('\\n').length },
                    match: deployed === local
                  };
                } catch (e) {
                  return { error: e.message };
                }
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
              comparison: result.result.value
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
 * Create resolveSourceLocation tool (simplified)
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createResolveSourceLocationTool(tabManager, cdp) {
  return {
    name: 'resolveSourceLocation',
    description: 'Resolve minified location to original source',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: { type: 'string' },
        file: { type: 'string', description: 'File name' },
        line: { type: 'number', description: 'Line number' },
        column: { type: 'number', description: 'Column number' }
      },
      required: ['file', 'line']
    },
    
    execute: async (params) => {
      const { urlPattern, file, line, column = 0 } = params;
      
      const tabs = urlPattern 
        ? tabManager.findTabs(urlPattern)
        : tabManager.getAllTabs();

      if (tabs.length === 0) {
        return {
          error: `No tabs found`,
          availableTabs: tabManager.getAllTabs().map(t => t.url)
        };
      }

      return {
        tabs: tabs.map(tab => ({
          tabId: tab.tabId,
          url: tab.url,
          input: { file, line, column },
          note: 'Source map resolution requires source-map library - placeholder implementation'
        }))
      };
    }
  };
}

