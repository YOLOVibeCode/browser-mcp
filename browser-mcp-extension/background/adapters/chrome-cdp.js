/**
 * ChromeCDP - Chrome DevTools Protocol Adapter
 * Pure JavaScript - Chrome Extension compatible
 * Implements IChromeCDP interface
 */

import { IChromeCDP } from '../interfaces.js';

/**
 * @class ChromeCDP
 * @implements {IChromeCDP}
 */
export class ChromeCDP extends IChromeCDP {
  /**
   * @param {Object} chromeApi - Chrome API (for testing, defaults to global chrome)
   */
  constructor(chromeApi = globalThis.chrome) {
    super();
    this.chrome = chromeApi;
    /** @type {Set<number>} */
    this.attachedTabs = new Set();
  }

  /**
   * Attach debugger to tab
   * @param {number} tabId - Chrome tab ID
   * @returns {Promise<void>}
   */
  async attach(tabId) {
    if (this.isAttached(tabId)) {
      return; // Already attached
    }

    return new Promise((resolve, reject) => {
      this.chrome.debugger.attach({ tabId }, '1.3', () => {
        if (this.chrome.runtime.lastError) {
          reject(new Error(this.chrome.runtime.lastError.message));
        } else {
          this.attachedTabs.add(tabId);
          resolve();
        }
      });
    });
  }

  /**
   * Detach debugger from tab
   * @param {number} tabId - Chrome tab ID
   * @returns {Promise<void>}
   */
  async detach(tabId) {
    if (!this.isAttached(tabId)) {
      return; // Not attached
    }

    return new Promise((resolve, reject) => {
      this.chrome.debugger.detach({ tabId }, () => {
        if (this.chrome.runtime.lastError) {
          // Ignore errors on detach (tab might be closed)
          console.warn(`Detach warning: ${this.chrome.runtime.lastError.message}`);
        }
        this.attachedTabs.delete(tabId);
        resolve();
      });
    });
  }

  /**
   * Send CDP command
   * @param {number} tabId - Chrome tab ID
   * @param {string} method - CDP method name
   * @param {Object} params - CDP method parameters
   * @returns {Promise<Object>} CDP result
   */
  async sendCommand(tabId, method, params = {}) {
    // Auto-attach if not attached
    if (!this.isAttached(tabId)) {
      await this.attach(tabId);
    }

    return new Promise((resolve, reject) => {
      this.chrome.debugger.sendCommand({ tabId }, method, params, (result) => {
        if (this.chrome.runtime.lastError) {
          reject(new Error(this.chrome.runtime.lastError.message));
        } else {
          resolve(result || {});
        }
      });
    });
  }

  /**
   * Check if debugger is attached to tab
   * @param {number} tabId - Chrome tab ID
   * @returns {boolean}
   */
  isAttached(tabId) {
    return this.attachedTabs.has(tabId);
  }

  /**
   * Get all attached tab IDs
   * @returns {Array<number>}
   */
  getAttachedTabs() {
    return Array.from(this.attachedTabs);
  }

  /**
   * Detach from all tabs
   * @returns {Promise<void>}
   */
  async detachAll() {
    const detachPromises = this.getAttachedTabs().map(tabId => this.detach(tabId));
    await Promise.all(detachPromises);
  }
}

