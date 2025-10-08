/**
 * DOM Tools - DOM inspection and querying
 * Pure JavaScript - Chrome Extension compatible
 */

/**
 * Create getDOM tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetDOMTool(tabManager, cdp) {
  return {
    name: 'getDOM',
    description: 'Get DOM tree from a browser tab',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: {
          type: 'string',
          description: 'URL pattern to match (e.g., "localhost:3000")'
        },
        selector: {
          type: 'string',
          description: 'Optional: CSS selector to get specific element'
        },
        maxDepth: {
          type: 'number',
          description: 'Optional: Maximum depth to traverse (default: 10)'
        }
      }
    },
    
    execute: async (params) => {
      const { urlPattern, selector, maxDepth = 10 } = params;
      
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
            // Enable DOM domain
            await cdp.sendCommand(tab.tabId, 'DOM.enable', {});
            
            // Get document root
            const doc = await cdp.sendCommand(tab.tabId, 'DOM.getDocument', { depth: -1 });
            
            let targetNode = doc.root;
            
            // If selector provided, query for it
            if (selector) {
              const result = await cdp.sendCommand(tab.tabId, 'DOM.querySelector', {
                nodeId: doc.root.nodeId,
                selector
              });
              
              if (!result.nodeId) {
                return {
                  tabId: tab.tabId,
                  url: tab.url,
                  error: `Element not found: ${selector}`
                };
              }
              
              // Get full subtree for this node
              await cdp.sendCommand(tab.tabId, 'DOM.requestChildNodes', {
                nodeId: result.nodeId,
                depth: maxDepth
              });
              
              targetNode = await cdp.sendCommand(tab.tabId, 'DOM.describeNode', {
                nodeId: result.nodeId
              });
            }
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              dom: _simplifyDOMNode(targetNode.node || targetNode, maxDepth)
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

      return {
        tabs: results,
        totalTabs: tabs.length
      };
    }
  };
}

/**
 * Create querySelector tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createQuerySelectorTool(tabManager, cdp) {
  return {
    name: 'querySelector',
    description: 'Query DOM elements using CSS selectors',
    inputSchema: {
      type: 'object',
      properties: {
        urlPattern: {
          type: 'string',
          description: 'URL pattern to match'
        },
        selector: {
          type: 'string',
          description: 'CSS selector'
        },
        all: {
          type: 'boolean',
          description: 'Find all matches (querySelectorAll)'
        }
      },
      required: ['selector']
    },
    
    execute: async (params) => {
      const { urlPattern, selector, all = false } = params;
      
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
            await cdp.sendCommand(tab.tabId, 'DOM.enable', {});
            const doc = await cdp.sendCommand(tab.tabId, 'DOM.getDocument', {});
            
            if (all) {
              // querySelectorAll
              const result = await cdp.sendCommand(tab.tabId, 'DOM.querySelectorAll', {
                nodeId: doc.root.nodeId,
                selector
              });
              
              const elements = await Promise.all(
                result.nodeIds.map(async (nodeId) => {
                  const node = await cdp.sendCommand(tab.tabId, 'DOM.describeNode', { nodeId });
                  return _simplifyDOMNode(node.node, 1);
                })
              );
              
              return {
                tabId: tab.tabId,
                url: tab.url,
                elements,
                count: elements.length
              };
            } else {
              // querySelector (single)
              const result = await cdp.sendCommand(tab.tabId, 'DOM.querySelector', {
                nodeId: doc.root.nodeId,
                selector
              });
              
              if (!result.nodeId) {
                return {
                  tabId: tab.tabId,
                  url: tab.url,
                  element: null
                };
              }
              
              const node = await cdp.sendCommand(tab.tabId, 'DOM.describeNode', {
                nodeId: result.nodeId
              });
              
              return {
                tabId: tab.tabId,
                url: tab.url,
                element: _simplifyDOMNode(node.node, 1)
              };
            }
          } catch (error) {
            return {
              tabId: tab.tabId,
              url: tab.url,
              error: error.message
            };
          }
        })
      );

      return {
        tabs: results,
        totalTabs: tabs.length
      };
    }
  };
}

/**
 * Create getAttributes tool
 * @param {ITabManager} tabManager 
 * @param {IChromeCDP} cdp 
 * @returns {IMCPTool}
 */
export function createGetAttributesTool(tabManager, cdp) {
  return {
    name: 'getAttributes',
    description: 'Get attributes of a DOM element',
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
            await cdp.sendCommand(tab.tabId, 'DOM.enable', {});
            const doc = await cdp.sendCommand(tab.tabId, 'DOM.getDocument', {});
            
            const result = await cdp.sendCommand(tab.tabId, 'DOM.querySelector', {
              nodeId: doc.root.nodeId,
              selector
            });
            
            if (!result.nodeId) {
              return {
                tabId: tab.tabId,
                url: tab.url,
                error: 'Element not found'
              };
            }
            
            const node = await cdp.sendCommand(tab.tabId, 'DOM.describeNode', {
              nodeId: result.nodeId
            });
            
            const attrs = {};
            if (node.node.attributes) {
              for (let i = 0; i < node.node.attributes.length; i += 2) {
                attrs[node.node.attributes[i]] = node.node.attributes[i + 1];
              }
            }
            
            return {
              tabId: tab.tabId,
              url: tab.url,
              selector,
              attributes: attrs
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
 * Simplify DOM node for output
 * @private
 */
function _simplifyDOMNode(node, maxDepth = 1, currentDepth = 0) {
  if (!node || currentDepth >= maxDepth) {
    return null;
  }

  const simplified = {
    nodeType: node.nodeType,
    nodeName: node.nodeName,
    nodeValue: node.nodeValue
  };

  if (node.attributes) {
    simplified.attributes = {};
    for (let i = 0; i < node.attributes.length; i += 2) {
      simplified.attributes[node.attributes[i]] = node.attributes[i + 1];
    }
  }

  if (node.children && node.children.length > 0 && currentDepth < maxDepth - 1) {
    simplified.children = node.children
      .map(child => _simplifyDOMNode(child, maxDepth, currentDepth + 1))
      .filter(Boolean);
  }

  return simplified;
}

