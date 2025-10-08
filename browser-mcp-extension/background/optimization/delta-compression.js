/**
 * Delta Compression - Send only changes on repeat queries
 * Pure JavaScript - Chrome Extension compatible
 * Implements IDeltaCompressor interface
 */

import { IDeltaCompressor } from '../interfaces.js';

/**
 * @class DeltaCompressor
 * @implements {IDeltaCompressor}
 */
export class DeltaCompressor extends IDeltaCompressor {
  constructor(options = {}) {
    super();
    
    this.options = {
      fullSyncThreshold: options.fullSyncThreshold || 10, // Reset to full after N deltas
      maxCacheSize: options.maxCacheSize || 100 // Max cached states
    };
    
    // Cache: key -> { data, version, deltaCount }
    this.cache = new Map();
  }

  /**
   * Compute delta from previous state
   * @param {string} key - Unique key for tracking (e.g., 'tab-123-console')
   * @param {Array|Object} currentState - Current state
   * @returns {Object} Delta result
   */
  computeDelta(key, currentState) {
    const cached = this.cache.get(key);
    
    // First call or cache expired - return full
    if (!cached) {
      const result = {
        type: 'full',
        version: 1,
        data: currentState
      };
      
      this.cache.set(key, {
        data: this._cloneData(currentState),
        version: 1,
        deltaCount: 0
      });
      
      return result;
    }
    
    // Check if we should reset to full sync
    if (cached.deltaCount >= this.options.fullSyncThreshold) {
      const result = {
        type: 'full',
        version: cached.version + 1,
        data: currentState,
        note: 'Full sync after threshold'
      };
      
      this.cache.set(key, {
        data: this._cloneData(currentState),
        version: cached.version + 1,
        deltaCount: 0
      });
      
      return result;
    }
    
    // Compute delta
    const delta = this._computeChanges(cached.data, currentState);
    
    const result = {
      type: 'delta',
      version: cached.version + 1,
      data: delta
    };
    
    // Update cache
    this.cache.set(key, {
      data: this._cloneData(currentState),
      version: cached.version + 1,
      deltaCount: cached.deltaCount + 1
    });
    
    return result;
  }

  /**
   * Compute changes between old and new data
   * @private
   */
  _computeChanges(oldData, newData) {
    // Handle arrays (most common case)
    if (Array.isArray(oldData) && Array.isArray(newData)) {
      return this._computeArrayDelta(oldData, newData);
    }
    
    // Handle objects
    if (typeof oldData === 'object' && typeof newData === 'object') {
      return this._computeObjectDelta(oldData, newData);
    }
    
    // Primitive types - return new if different
    return oldData !== newData ? newData : [];
  }

  /**
   * Compute delta for arrays
   * @private
   */
  _computeArrayDelta(oldArray, newArray) {
    // Simple approach: return items that weren't in old array
    // Assumes items have 'id' field for comparison
    
    const oldIds = new Set(oldArray.map(item => 
      item.id !== undefined ? item.id : JSON.stringify(item)
    ));
    
    const newItems = newArray.filter(item => {
      const itemId = item.id !== undefined ? item.id : JSON.stringify(item);
      return !oldIds.has(itemId);
    });
    
    return newItems;
  }

  /**
   * Compute delta for objects
   * @private
   */
  _computeObjectDelta(oldObj, newObj) {
    const changes = {};
    
    // Find changed or new keys
    for (const key in newObj) {
      if (JSON.stringify(oldObj[key]) !== JSON.stringify(newObj[key])) {
        changes[key] = newObj[key];
      }
    }
    
    // Find deleted keys
    for (const key in oldObj) {
      if (!(key in newObj)) {
        changes[key] = null; // Indicate deletion
      }
    }
    
    return changes;
  }

  /**
   * Clone data for caching
   * @private
   */
  _cloneData(data) {
    try {
      return JSON.parse(JSON.stringify(data));
    } catch (error) {
      console.warn('Failed to clone data:', error);
      return data;
    }
  }

  /**
   * Clear cache for specific key
   * @param {string} key
   */
  clear(key) {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAll() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {Object}
   */
  getStats() {
    let totalDeltas = 0;
    let avgVersion = 0;
    
    for (const cached of this.cache.values()) {
      totalDeltas += cached.deltaCount;
      avgVersion += cached.version;
    }
    
    const cacheSize = this.cache.size;
    
    return {
      cachedKeys: cacheSize,
      totalDeltas,
      avgVersion: cacheSize > 0 ? (avgVersion / cacheSize).toFixed(1) : 0,
      cacheMemory: this._estimateCacheSize()
    };
  }

  /**
   * Estimate cache memory usage
   * @private
   */
  _estimateCacheSize() {
    try {
      const serialized = JSON.stringify(Array.from(this.cache.entries()));
      return `${(serialized.length / 1024).toFixed(1)} KB`;
    } catch (error) {
      return 'Unknown';
    }
  }
}

