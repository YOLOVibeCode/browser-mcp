/**
 * Core Interfaces for Browser MCP Extension
 * Following Interface Segregation Principle (ISP)
 * 
 * Pure JavaScript - Chrome Extension compatible
 */

/**
 * @interface IMCPServer
 * @description Handles MCP JSON-RPC 2.0 protocol
 */
export class IMCPServer {
  /**
   * Register a tool with the MCP server
   * @param {IMCPTool} tool - Tool to register
   * @returns {void}
   */
  registerTool(tool) {
    throw new Error('Not implemented');
  }

  /**
   * Handle incoming MCP request
   * @param {Object} request - JSON-RPC 2.0 request
   * @returns {Promise<Object>} JSON-RPC 2.0 response
   */
  async handleRequest(request) {
    throw new Error('Not implemented');
  }

  /**
   * Start the MCP server
   * @returns {Promise<void>}
   */
  async start() {
    throw new Error('Not implemented');
  }
}

/**
 * @interface IMCPTool
 * @description Represents a single MCP tool
 */
export class IMCPTool {
  /**
   * @type {string} Tool name
   */
  name = '';

  /**
   * @type {string} Tool description
   */
  description = '';

  /**
   * @type {Object} JSON Schema for tool input
   */
  inputSchema = {};

  /**
   * Execute the tool
   * @param {Object} params - Tool parameters
   * @returns {Promise<Object>} Tool result
   */
  async execute(params) {
    throw new Error('Not implemented');
  }
}

/**
 * @interface ITabManager
 * @description Manages Chrome tab state
 */
export class ITabManager {
  /**
   * Get all tracked tabs
   * @returns {Array<Object>} Array of tab info
   */
  getAllTabs() {
    throw new Error('Not implemented');
  }

  /**
   * Find tabs matching URL pattern
   * @param {string} urlPattern - URL pattern to match
   * @returns {Array<Object>} Matching tabs
   */
  findTabs(urlPattern) {
    throw new Error('Not implemented');
  }

  /**
   * Register a new tab
   * @param {number} tabId - Chrome tab ID
   * @param {string} url - Tab URL
   * @returns {void}
   */
  registerTab(tabId, url) {
    throw new Error('Not implemented');
  }

  /**
   * Unregister a tab
   * @param {number} tabId - Chrome tab ID
   * @returns {void}
   */
  unregisterTab(tabId) {
    throw new Error('Not implemented');
  }
}

/**
 * @interface IChromeCDP
 * @description Chrome DevTools Protocol adapter
 */
export class IChromeCDP {
  /**
   * Attach debugger to tab
   * @param {number} tabId - Chrome tab ID
   * @returns {Promise<void>}
   */
  async attach(tabId) {
    throw new Error('Not implemented');
  }

  /**
   * Detach debugger from tab
   * @param {number} tabId - Chrome tab ID
   * @returns {Promise<void>}
   */
  async detach(tabId) {
    throw new Error('Not implemented');
  }

  /**
   * Send CDP command
   * @param {number} tabId - Chrome tab ID
   * @param {string} method - CDP method name
   * @param {Object} params - CDP method parameters
   * @returns {Promise<Object>} CDP result
   */
  async sendCommand(tabId, method, params) {
    throw new Error('Not implemented');
  }

  /**
   * Check if debugger is attached to tab
   * @param {number} tabId - Chrome tab ID
   * @returns {boolean}
   */
  isAttached(tabId) {
    throw new Error('Not implemented');
  }
}

/**
 * @interface INativeMessaging
 * @description Native messaging (stdio) adapter for IDE communication
 */
export class INativeMessaging {
  /**
   * Send message to native host
   * @param {Object} message - Message to send
   * @returns {Promise<void>}
   */
  async sendMessage(message) {
    throw new Error('Not implemented');
  }

  /**
   * Start listening for native messages
   * @param {Function} onMessage - Message handler
   * @returns {void}
   */
  startListening(onMessage) {
    throw new Error('Not implemented');
  }

  /**
   * Stop listening for native messages
   * @returns {void}
   */
  stopListening() {
    throw new Error('Not implemented');
  }
}

/**
 * @interface IMessageFilter
 * @description Filters out noise from browser events
 */
export class IMessageFilter {
  /**
   * Filter a message
   * @param {Object} message - Message to filter
   * @returns {Object|null} Filtered message or null if should be dropped
   */
  filter(message) {
    throw new Error('Not implemented');
  }
}

/**
 * @interface IDeltaCompressor
 * @description Tracks changes and sends only deltas
 */
export class IDeltaCompressor {
  /**
   * Compute delta from previous state
   * @param {string} key - Unique key for tracking
   * @param {Object} currentState - Current state
   * @returns {Object} Delta result
   */
  computeDelta(key, currentState) {
    throw new Error('Not implemented');
  }
}

