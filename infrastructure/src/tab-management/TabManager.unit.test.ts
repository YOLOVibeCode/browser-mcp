import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  ITabManager,
  TabAlreadyActiveError,
  TabNotActiveError,
} from '@browser-mcp/contracts/mcp-server';
import { IEventBus } from '@browser-mcp/contracts/events';
import { TabInfo } from '@browser-mcp/contracts/types';
import { TabManager } from './TabManager';
import { EventEmitterBus } from '../event-bus/EventEmitterBus';

describe('TabManager (Unit Test - Real EventBus)', () => {
  let tabManager: ITabManager;
  let eventBus: IEventBus;

  beforeEach(() => {
    eventBus = new EventEmitterBus();
    tabManager = new TabManager(eventBus);
  });

  describe('activateTab', () => {
    it('should activate a tab and emit TabActivated event', async () => {
      const handler = vi.fn();
      eventBus.on('TabActivated', handler);

      await tabManager.activateTab(1, 'http://localhost:3000', 3142);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({
        tabId: 1,
        url: 'http://localhost:3000',
        port: 3142,
        timestamp: expect.any(Number),
      });
    });

    it('should mark tab as active', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000', 3142);

      expect(tabManager.isTabActive(1)).toBe(true);
    });

    it('should store tab info', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000', 3142);

      const tabInfo = tabManager.getTabInfo(1);
      expect(tabInfo).toMatchObject({
        tabId: 1,
        url: 'http://localhost:3000',
        port: 3142,
        isActive: true,
      });
      expect(tabInfo?.virtualFilesystemURI).toBe('browser://tab-localhost-3000/');
    });

    it('should allow reactivating same tab (update)', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000', 3142);
      await tabManager.activateTab(1, 'http://localhost:8080', 3143);

      const tabInfo = tabManager.getTabInfo(1);
      expect(tabInfo?.url).toBe('http://localhost:8080');
      expect(tabInfo?.port).toBe(3143);
    });
  });

  describe('deactivateTab', () => {
    it('should deactivate a tab and emit TabDeactivated event', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000', 3142);

      const handler = vi.fn();
      eventBus.on('TabDeactivated', handler);

      await tabManager.deactivateTab(1);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({
        tabId: 1,
        timestamp: expect.any(Number),
      });
    });

    it('should mark tab as inactive', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000', 3142);
      await tabManager.deactivateTab(1);

      expect(tabManager.isTabActive(1)).toBe(false);
    });

    it('should remove tab info', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000', 3142);
      await tabManager.deactivateTab(1);

      expect(tabManager.getTabInfo(1)).toBeNull();
    });

    it('should be idempotent (no error if tab not active)', async () => {
      await expect(tabManager.deactivateTab(999)).resolves.not.toThrow();
    });
  });

  describe('getTabInfo', () => {
    it('should return tab info for active tab', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000', 3142);

      const tabInfo = tabManager.getTabInfo(1);
      expect(tabInfo).not.toBeNull();
      expect(tabInfo?.tabId).toBe(1);
    });

    it('should return null for inactive tab', () => {
      expect(tabManager.getTabInfo(999)).toBeNull();
    });
  });

  describe('getAllActiveTabs', () => {
    it('should return empty array when no tabs active', () => {
      expect(tabManager.getAllActiveTabs()).toEqual([]);
    });

    it('should return all active tabs', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000', 3142);
      await tabManager.activateTab(2, 'http://localhost:8080', 3143);
      await tabManager.activateTab(3, 'http://example.com', 3144);

      const tabs = tabManager.getAllActiveTabs();
      expect(tabs).toHaveLength(3);
      expect(tabs.map(t => t.tabId)).toEqual([1, 2, 3]);
    });
  });

  describe('isTabActive', () => {
    it('should return true for active tab', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000', 3142);
      expect(tabManager.isTabActive(1)).toBe(true);
    });

    it('should return false for inactive tab', () => {
      expect(tabManager.isTabActive(999)).toBe(false);
    });
  });

  describe('getVirtualFilesystemURI', () => {
    it('should generate correct URI from URL', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000', 3142);
      expect(tabManager.getVirtualFilesystemURI(1)).toBe('browser://tab-localhost-3000/');
    });

    it('should handle URLs with paths', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000/app/dashboard', 3142);
      expect(tabManager.getVirtualFilesystemURI(1)).toBe('browser://tab-localhost-3000/');
    });

    it('should handle URLs with query params', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000?debug=true', 3142);
      expect(tabManager.getVirtualFilesystemURI(1)).toBe('browser://tab-localhost-3000/');
    });

    it('should handle different domains', async () => {
      await tabManager.activateTab(1, 'https://example.com', 3142);
      expect(tabManager.getVirtualFilesystemURI(1)).toBe('browser://tab-example-com/');
    });

    it('should return null for inactive tab', () => {
      expect(tabManager.getVirtualFilesystemURI(999)).toBeNull();
    });
  });

  describe('multi-tab scenario', () => {
    it('should handle multiple active tabs independently', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000', 3142);
      await tabManager.activateTab(2, 'http://localhost:8080', 3143);
      await tabManager.activateTab(3, 'https://example.com', 3144);

      expect(tabManager.isTabActive(1)).toBe(true);
      expect(tabManager.isTabActive(2)).toBe(true);
      expect(tabManager.isTabActive(3)).toBe(true);
      expect(tabManager.getAllActiveTabs()).toHaveLength(3);
    });

    it('should allow deactivating specific tab without affecting others', async () => {
      await tabManager.activateTab(1, 'http://localhost:3000', 3142);
      await tabManager.activateTab(2, 'http://localhost:8080', 3143);
      await tabManager.activateTab(3, 'https://example.com', 3144);

      await tabManager.deactivateTab(2);

      expect(tabManager.isTabActive(1)).toBe(true);
      expect(tabManager.isTabActive(2)).toBe(false);
      expect(tabManager.isTabActive(3)).toBe(true);
      expect(tabManager.getAllActiveTabs()).toHaveLength(2);
    });
  });

  describe('event integration', () => {
    it('should emit events in correct order', async () => {
      const events: string[] = [];
      eventBus.on('TabActivated', () => events.push('activated'));
      eventBus.on('TabDeactivated', () => events.push('deactivated'));

      await tabManager.activateTab(1, 'http://localhost:3000', 3142);
      await tabManager.deactivateTab(1);

      expect(events).toEqual(['activated', 'deactivated']);
    });
  });
});
