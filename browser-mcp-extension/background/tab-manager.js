/**
 * TabManager - Manages Chrome tab state
 * Pure JavaScript - Chrome Extension compatible
 * Implements ITabManager interface
 */

import { ITabManager } from './interfaces.js';

/**
 * @class TabManager
 * @implements {ITabManager}
 */
export class TabManager extends ITabManager {
  constructor() {
    super();
    /** @type {Map<number, Object>} */
    this.tabs = new Map();
  }

  /**
   * Get all tracked tabs
   * @returns {Array<Object>} Array of tab info
   */
  getAllTabs() {
    return Array.from(this.tabs.values());
  }

  /**
   * Find tabs matching URL pattern
   * @param {string} urlPattern - URL pattern to match
   * @returns {Array<Object>} Matching tabs
   */
  findTabs(urlPattern) {
    const allTabs = this.getAllTabs();
    return allTabs.filter(tab => tab.url.includes(urlPattern));
  }

  /**
   * Register a new tab (or update existing)
   * @param {number} tabId - Chrome tab ID
   * @param {string} url - Tab URL
   * @returns {void}
   */
  registerTab(tabId, url) {
    this.tabs.set(tabId, {
      tabId,
      url,
      registeredAt: Date.now()
    });
  }

  /**
   * Unregister a tab
   * @param {number} tabId - Chrome tab ID
   * @returns {void}
   */
  unregisterTab(tabId) {
    this.tabs.delete(tabId);
  }

  /**
   * Check if tab is registered
   * @param {number} tabId - Chrome tab ID
   * @returns {boolean}
   */
  hasTab(tabId) {
    return this.tabs.has(tabId);
  }

  /**
   * Get specific tab info
   * @param {number} tabId - Chrome tab ID
   * @returns {Object|null}
   */
  getTab(tabId) {
    return this.tabs.get(tabId) || null;
  }
}

