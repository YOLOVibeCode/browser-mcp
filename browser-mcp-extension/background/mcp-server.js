/**
 * MCPServer - Model Context Protocol JSON-RPC 2.0 Server
 * Pure JavaScript - Chrome Extension compatible
 * Implements IMCPServer interface
 */

import { IMCPServer } from './interfaces.js';

/**
 * @class MCPServer
 * @implements {IMCPServer}
 */
export class MCPServer extends IMCPServer {
  constructor() {
    super();
    /** @type {Map<string, IMCPTool>} */
    this.tools = new Map();
    this.initialized = false;
  }

  /**
   * Register a tool with the MCP server
   * @param {IMCPTool} tool - Tool to register
   * @returns {void}
   */
  registerTool(tool) {
    this.tools.set(tool.name, tool);
  }

  /**
   * Handle incoming MCP request (JSON-RPC 2.0)
   * @param {Object} request - JSON-RPC 2.0 request
   * @returns {Promise<Object>} JSON-RPC 2.0 response
   */
  async handleRequest(request) {
    // Validate JSON-RPC format
    if (!request || !request.jsonrpc || !request.method) {
      return this._createErrorResponse(null, -32600, 'Invalid Request');
    }

    const { id, method, params } = request;

    try {
      // Handle MCP protocol methods
      switch (method) {
        case 'initialize':
          return this._handleInitialize(id, params);
        
        case 'tools/list':
          return this._handleToolsList(id);
        
        case 'tools/call':
          return await this._handleToolsCall(id, params);
        
        default:
          return this._createErrorResponse(id, -32601, 'Method not found');
      }
    } catch (error) {
      return this._createErrorResponse(id, -32603, 'Internal error', error.message);
    }
  }

  /**
   * Handle initialize request
   * @private
   */
  _handleInitialize(id, params) {
    this.initialized = true;
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: '2024-11-05',
        serverInfo: {
          name: 'browser-mcp',
          version: '4.0.1'
        },
        capabilities: {
          tools: {}
        }
      }
    };
  }

  /**
   * Handle tools/list request
   * @private
   */
  _handleToolsList(id) {
    const tools = Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema
    }));

    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools
      }
    };
  }

  /**
   * Handle tools/call request
   * @private
   */
  async _handleToolsCall(id, params) {
    if (!params || !params.name) {
      return this._createErrorResponse(id, -32602, 'Invalid params: missing tool name');
    }

    const tool = this.tools.get(params.name);
    if (!tool) {
      return this._createErrorResponse(id, -32602, `Tool not found: ${params.name}`);
    }

    try {
      const result = await tool.execute(params.arguments || {});
      return {
        jsonrpc: '2.0',
        id,
        result
      };
    } catch (error) {
      return this._createErrorResponse(id, -32603, 'Tool execution failed', error.message);
    }
  }

  /**
   * Create JSON-RPC error response
   * @private
   */
  _createErrorResponse(id, code, message, data = null) {
    const response = {
      jsonrpc: '2.0',
      id: id || null,
      error: {
        code,
        message
      }
    };

    if (data) {
      response.error.data = data;
    }

    return response;
  }

  /**
   * Start the MCP server
   * @returns {Promise<void>}
   */
  async start() {
    console.log('[MCP Server] Starting Browser MCP v4.0.1...');
    console.log(`[MCP Server] Registered ${this.tools.size} tools`);
  }

  /**
   * Get number of registered tools
   * @returns {number}
   */
  getToolCount() {
    return this.tools.size;
  }

  /**
   * Get all tool names
   * @returns {Array<string>}
   */
  getToolNames() {
    return Array.from(this.tools.keys());
  }
}

