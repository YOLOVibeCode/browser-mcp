import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  IPortManager,
  NoAvailablePortError,
  PortAlreadyReservedError,
} from '@browser-mcp/contracts/mcp-server';
import { PortManager } from './PortManager';

describe('PortManager (Unit Test - Real Port Checking)', () => {
  let portManager: IPortManager;

  beforeEach(() => {
    portManager = new PortManager();
  });

  describe('findAvailablePort', () => {
    it('should find an available port in default range (3100-3199)', async () => {
      const port = await portManager.findAvailablePort();

      expect(port).toBeGreaterThanOrEqual(3100);
      expect(port).toBeLessThanOrEqual(3199);
    });

    it('should return different ports for sequential calls', async () => {
      const port1 = await portManager.findAvailablePort();
      portManager.reservePort(1, port1); // Reserve first port

      const port2 = await portManager.findAvailablePort();

      expect(port2).not.toBe(port1);
    });
  });

  describe('isPortAvailable', () => {
    it('should return true for available ports', async () => {
      const available = await portManager.isPortAvailable(3150);
      expect(available).toBe(true);
    });

    it('should return false for reserved ports', async () => {
      const port = await portManager.findAvailablePort();
      portManager.reservePort(1, port);

      const available = await portManager.isPortAvailable(port);
      expect(available).toBe(false);
    });
  });

  describe('reservePort', () => {
    it('should reserve a port for a tab', async () => {
      const port = 3142;
      const tabId = 1;

      portManager.reservePort(tabId, port);

      expect(portManager.getPortForTab(tabId)).toBe(port);
      expect(portManager.getTabForPort(port)).toBe(tabId);
    });

    it('should throw PortAlreadyReservedError if port is already reserved', async () => {
      const port = 3142;

      portManager.reservePort(1, port);

      expect(() => portManager.reservePort(2, port)).toThrow(PortAlreadyReservedError);
      expect(() => portManager.reservePort(2, port)).toThrow(`Port ${port} is already reserved`);
    });

    it('should allow same tab to update its port reservation', async () => {
      const tabId = 1;

      portManager.reservePort(tabId, 3142);
      portManager.reservePort(tabId, 3143); // Update reservation

      expect(portManager.getPortForTab(tabId)).toBe(3143);
      expect(portManager.getTabForPort(3142)).toBeNull(); // Old port released
    });
  });

  describe('releasePort', () => {
    it('should release a port from a tab', async () => {
      const port = 3142;
      const tabId = 1;

      portManager.reservePort(tabId, port);
      portManager.releasePort(tabId);

      expect(portManager.getPortForTab(tabId)).toBeNull();
      expect(portManager.getTabForPort(port)).toBeNull();
    });

    it('should be idempotent (no error if tab has no port)', async () => {
      expect(() => portManager.releasePort(999)).not.toThrow();
    });
  });

  describe('getPortForTab', () => {
    it('should return port for reserved tab', async () => {
      portManager.reservePort(1, 3142);
      expect(portManager.getPortForTab(1)).toBe(3142);
    });

    it('should return null for unreserved tab', async () => {
      expect(portManager.getPortForTab(999)).toBeNull();
    });
  });

  describe('getTabForPort', () => {
    it('should return tab ID for reserved port', async () => {
      portManager.reservePort(1, 3142);
      expect(portManager.getTabForPort(3142)).toBe(1);
    });

    it('should return null for unreserved port', async () => {
      expect(portManager.getTabForPort(9999)).toBeNull();
    });
  });

  describe('getAllReservedPorts', () => {
    it('should return empty map when no ports reserved', async () => {
      const ports = portManager.getAllReservedPorts();
      expect(ports.size).toBe(0);
    });

    it('should return all reserved ports', async () => {
      portManager.reservePort(1, 3142);
      portManager.reservePort(2, 3143);
      portManager.reservePort(3, 3144);

      const ports = portManager.getAllReservedPorts();

      expect(ports.size).toBe(3);
      expect(ports.get(1)).toBe(3142);
      expect(ports.get(2)).toBe(3143);
      expect(ports.get(3)).toBe(3144);
    });
  });

  describe('multi-tab scenario', () => {
    it('should handle multiple tabs with different ports', async () => {
      // Simulate 3 tabs activating
      const port1 = await portManager.findAvailablePort();
      portManager.reservePort(1, port1);

      const port2 = await portManager.findAvailablePort();
      portManager.reservePort(2, port2);

      const port3 = await portManager.findAvailablePort();
      portManager.reservePort(3, port3);

      expect(portManager.getAllReservedPorts().size).toBe(3);
      expect(new Set([port1, port2, port3]).size).toBe(3); // All unique
    });

    it('should allow releasing specific tab without affecting others', async () => {
      portManager.reservePort(1, 3142);
      portManager.reservePort(2, 3143);
      portManager.reservePort(3, 3144);

      portManager.releasePort(2); // Release middle tab

      expect(portManager.getPortForTab(1)).toBe(3142);
      expect(portManager.getPortForTab(2)).toBeNull();
      expect(portManager.getPortForTab(3)).toBe(3144);
    });
  });
});
