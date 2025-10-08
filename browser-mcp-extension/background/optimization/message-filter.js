/**
 * Message Filter - Intelligent noise filtering
 * Pure JavaScript - Chrome Extension compatible
 * Implements IMessageFilter interface
 */

import { IMessageFilter } from '../interfaces.js';

/**
 * @class MessageFilter
 * @implements {IMessageFilter}
 */
export class MessageFilter extends IMessageFilter {
  constructor(options = {}) {
    super();
    
    // Default noise patterns to filter
    this.defaultPatterns = [
      '[HMR]',
      '[webpack]',
      'webpack-dev-server',
      'webpack compiled',
      '[vite]',
      '[Fast Refresh]',
      'Download the React DevTools',
      'socket.io',
      'Connected to DevTools',
      '%c' // Console styling
    ];
    
    // Resource types to filter (network requests)
    this.filteredResourceTypes = [
      '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', // Images
      '.woff', '.woff2', '.ttf', '.eot', // Fonts
      '.css', '.scss', '.less', // Stylesheets (usually not needed)
      '.mp4', '.webm', '.ogg' // Media
    ];
    
    // Custom patterns from options
    this.customPatterns = options.ignorePatterns || [];
    
    // All patterns combined
    this.allPatterns = [...this.defaultPatterns, ...this.customPatterns];
    
    // Statistics
    this.stats = {
      total: 0,
      filtered: 0,
      passed: 0
    };
  }

  /**
   * Filter a message
   * @param {Object} message - Message to filter
   * @returns {Object|null} Filtered message or null if should be dropped
   */
  filter(message) {
    this.stats.total++;
    
    // NEVER filter errors or warnings - these are always important
    if (message.type === 'error' || message.type === 'warning') {
      this.stats.passed++;
      return message;
    }
    
    // Check network requests
    if (message.type === 'network' && message.url) {
      if (this._shouldFilterNetworkRequest(message.url)) {
        this.stats.filtered++;
        return null;
      }
    }
    
    // Check text-based messages
    if (message.text) {
      if (this._shouldFilterText(message.text)) {
        this.stats.filtered++;
        return null;
      }
    }
    
    // Message passes filter
    this.stats.passed++;
    return message;
  }

  /**
   * Check if text should be filtered
   * @private
   */
  _shouldFilterText(text) {
    const lowerText = text.toLowerCase();
    
    for (const pattern of this.allPatterns) {
      if (lowerText.includes(pattern.toLowerCase())) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Check if network request should be filtered
   * @private
   */
  _shouldFilterNetworkRequest(url) {
    const lowerUrl = url.toLowerCase();
    
    for (const ext of this.filteredResourceTypes) {
      if (lowerUrl.endsWith(ext)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get filter statistics
   * @returns {Object}
   */
  getStats() {
    return {
      ...this.stats,
      filterRate: this.stats.total > 0 
        ? ((this.stats.filtered / this.stats.total) * 100).toFixed(1) + '%'
        : '0%'
    };
  }

  /**
   * Reset statistics
   */
  resetStats() {
    this.stats = {
      total: 0,
      filtered: 0,
      passed: 0
    };
  }

  /**
   * Add custom pattern
   * @param {string} pattern
   */
  addPattern(pattern) {
    if (!this.customPatterns.includes(pattern)) {
      this.customPatterns.push(pattern);
      this.allPatterns = [...this.defaultPatterns, ...this.customPatterns];
    }
  }

  /**
   * Remove custom pattern
   * @param {string} pattern
   */
  removePattern(pattern) {
    this.customPatterns = this.customPatterns.filter(p => p !== pattern);
    this.allPatterns = [...this.defaultPatterns, ...this.customPatterns];
  }
}

