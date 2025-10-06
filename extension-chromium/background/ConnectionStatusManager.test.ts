/**
 * TDD Tests for Connection Status Manager
 * Tests follow the Arrange-Act-Assert pattern
 */

import { describe, it, expect, vi } from 'vitest';
import {
  calculateBadgeUpdate,
  isConnected,
  formatConnectionStatus,
  applyBadgeUpdate,
  type IConnectionStatus,
  type IChromeActionAPI
} from './ConnectionStatusManager';

describe('ConnectionStatusManager - Badge Calculation', () => {
  describe('calculateBadgeUpdate', () => {
    it('should return empty badge when no tabs are active', () => {
      // Arrange
      const status: IConnectionStatus = {
        hasActiveConnections: false,
        activeTabCount: 0
      };

      // Act
      const result = calculateBadgeUpdate(status);

      // Assert
      expect(result.text).toBe('');
      expect(result.title).toBe('Browser Inspector - Not Connected');
    });

    it('should return badge with "1" when one tab is active', () => {
      // Arrange
      const status: IConnectionStatus = {
        hasActiveConnections: true,
        activeTabCount: 1
      };

      // Act
      const result = calculateBadgeUpdate(status);

      // Assert
      expect(result.text).toBe('1');
      expect(result.backgroundColor).toBe('#28a745'); // Green
      expect(result.title).toBe('Browser Inspector - 1 active tab');
    });

    it('should return badge with "2" when two tabs are active', () => {
      // Arrange
      const status: IConnectionStatus = {
        hasActiveConnections: true,
        activeTabCount: 2
      };

      // Act
      const result = calculateBadgeUpdate(status);

      // Assert
      expect(result.text).toBe('2');
      expect(result.backgroundColor).toBe('#28a745');
      expect(result.title).toBe('Browser Inspector - 2 active tabs');
    });

    it('should use plural "tabs" for multiple tabs', () => {
      // Arrange
      const status: IConnectionStatus = {
        hasActiveConnections: true,
        activeTabCount: 5
      };

      // Act
      const result = calculateBadgeUpdate(status);

      // Assert
      expect(result.title).toContain('tabs'); // plural
      expect(result.title).not.toContain('1 active tab'); // not singular
    });

    it('should handle large number of tabs', () => {
      // Arrange
      const status: IConnectionStatus = {
        hasActiveConnections: true,
        activeTabCount: 99
      };

      // Act
      const result = calculateBadgeUpdate(status);

      // Assert
      expect(result.text).toBe('99');
      expect(result.title).toBe('Browser Inspector - 99 active tabs');
    });
  });

  describe('isConnected', () => {
    it('should return false when no tabs are active', () => {
      expect(isConnected(0)).toBe(false);
    });

    it('should return true when one tab is active', () => {
      expect(isConnected(1)).toBe(true);
    });

    it('should return true when multiple tabs are active', () => {
      expect(isConnected(5)).toBe(true);
    });

    it('should return false for negative numbers (edge case)', () => {
      expect(isConnected(-1)).toBe(false);
    });
  });

  describe('formatConnectionStatus', () => {
    it('should return "Not Connected" when no tabs are active', () => {
      expect(formatConnectionStatus(0)).toBe('Not Connected');
    });

    it('should return singular form for one tab', () => {
      expect(formatConnectionStatus(1)).toBe('Connected to 1 tab');
    });

    it('should return plural form for multiple tabs', () => {
      expect(formatConnectionStatus(2)).toBe('Connected to 2 tabs');
      expect(formatConnectionStatus(10)).toBe('Connected to 10 tabs');
    });
  });

  describe('applyBadgeUpdate', () => {
    it('should call all Chrome API methods with correct values', () => {
      // Arrange
      const mockChromeAPI: IChromeActionAPI = {
        setBadgeText: vi.fn(),
        setBadgeBackgroundColor: vi.fn(),
        setTitle: vi.fn()
      };

      const update = {
        text: '3',
        backgroundColor: '#28a745',
        title: 'Browser Inspector - 3 active tabs'
      };

      // Act
      applyBadgeUpdate(update, mockChromeAPI);

      // Assert
      expect(mockChromeAPI.setBadgeText).toHaveBeenCalledWith({ text: '3' });
      expect(mockChromeAPI.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#28a745' });
      expect(mockChromeAPI.setTitle).toHaveBeenCalledWith({ title: 'Browser Inspector - 3 active tabs' });
    });

    it('should not set background color when badge text is empty', () => {
      // Arrange
      const mockChromeAPI: IChromeActionAPI = {
        setBadgeText: vi.fn(),
        setBadgeBackgroundColor: vi.fn(),
        setTitle: vi.fn()
      };

      const update = {
        text: '',
        backgroundColor: '#ff9500',
        title: 'Browser Inspector - Not Connected'
      };

      // Act
      applyBadgeUpdate(update, mockChromeAPI);

      // Assert
      expect(mockChromeAPI.setBadgeText).toHaveBeenCalledWith({ text: '' });
      expect(mockChromeAPI.setBadgeBackgroundColor).not.toHaveBeenCalled();
      expect(mockChromeAPI.setTitle).toHaveBeenCalledWith({ title: 'Browser Inspector - Not Connected' });
    });

    it('should handle API errors gracefully', () => {
      // Arrange
      const mockChromeAPI: IChromeActionAPI = {
        setBadgeText: vi.fn(() => { throw new Error('API Error'); }),
        setBadgeBackgroundColor: vi.fn(),
        setTitle: vi.fn()
      };

      const update = {
        text: '1',
        backgroundColor: '#28a745',
        title: 'Test'
      };

      // Act & Assert - should throw since we're not catching
      expect(() => applyBadgeUpdate(update, mockChromeAPI)).toThrow('API Error');
    });
  });
});

describe('ConnectionStatusManager - Integration Scenarios', () => {
  it('should handle complete flow: no tabs → 1 tab → 2 tabs → 0 tabs', () => {
    const mockAPI: IChromeActionAPI = {
      setBadgeText: vi.fn(),
      setBadgeBackgroundColor: vi.fn(),
      setTitle: vi.fn()
    };

    // No tabs
    let status: IConnectionStatus = { hasActiveConnections: false, activeTabCount: 0 };
    let update = calculateBadgeUpdate(status);
    applyBadgeUpdate(update, mockAPI);
    expect(mockAPI.setBadgeText).toHaveBeenLastCalledWith({ text: '' });

    // Add 1 tab
    status = { hasActiveConnections: true, activeTabCount: 1 };
    update = calculateBadgeUpdate(status);
    applyBadgeUpdate(update, mockAPI);
    expect(mockAPI.setBadgeText).toHaveBeenLastCalledWith({ text: '1' });

    // Add 2nd tab
    status = { hasActiveConnections: true, activeTabCount: 2 };
    update = calculateBadgeUpdate(status);
    applyBadgeUpdate(update, mockAPI);
    expect(mockAPI.setBadgeText).toHaveBeenLastCalledWith({ text: '2' });

    // Remove all tabs
    status = { hasActiveConnections: false, activeTabCount: 0 };
    update = calculateBadgeUpdate(status);
    applyBadgeUpdate(update, mockAPI);
    expect(mockAPI.setBadgeText).toHaveBeenLastCalledWith({ text: '' });
  });
});
