import { describe, it, expect, beforeEach, vi } from 'vitest';
import { IEventBus } from '@browser-mcp/contracts/events';
import { EventEmitterBus } from './EventEmitterBus';

describe('EventEmitterBus (Unit Test - Real EventEmitter3)', () => {
  let eventBus: IEventBus;

  beforeEach(() => {
    eventBus = new EventEmitterBus();
  });

  describe('emit and on', () => {
    it('should emit and receive events', () => {
      const handler = vi.fn();
      const payload = { message: 'Hello' };

      eventBus.on('TestEvent', handler);
      eventBus.emit('TestEvent', payload);

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(payload);
    });

    it('should support multiple handlers for same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const payload = { count: 42 };

      eventBus.on('MultipleHandlers', handler1);
      eventBus.on('MultipleHandlers', handler2);
      eventBus.emit('MultipleHandlers', payload);

      expect(handler1).toHaveBeenCalledWith(payload);
      expect(handler2).toHaveBeenCalledWith(payload);
    });

    it('should return unsubscribe function from on()', () => {
      const handler = vi.fn();

      const unsubscribe = eventBus.on('Unsubscribe', handler);
      eventBus.emit('Unsubscribe', { test: 1 });
      expect(handler).toHaveBeenCalledOnce();

      // Unsubscribe
      unsubscribe();
      eventBus.emit('Unsubscribe', { test: 2 });
      expect(handler).toHaveBeenCalledOnce(); // Still only called once
    });
  });

  describe('once', () => {
    it('should handle event only once', () => {
      const handler = vi.fn();

      eventBus.once('OnceEvent', handler);
      eventBus.emit('OnceEvent', { first: true });
      eventBus.emit('OnceEvent', { second: true });

      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith({ first: true });
    });
  });

  describe('off', () => {
    it('should remove specific handler', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on('OffEvent', handler1);
      eventBus.on('OffEvent', handler2);

      eventBus.off('OffEvent', handler1);
      eventBus.emit('OffEvent', { test: true });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledWith({ test: true });
    });
  });

  describe('removeAllListeners', () => {
    it('should remove all listeners for specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on('RemoveAll', handler1);
      eventBus.on('RemoveAll', handler2);
      eventBus.on('KeepThis', handler1);

      eventBus.removeAllListeners('RemoveAll');

      eventBus.emit('RemoveAll', { removed: true });
      eventBus.emit('KeepThis', { kept: true });

      expect(handler1).not.toHaveBeenCalledWith({ removed: true });
      expect(handler2).not.toHaveBeenCalled();
      expect(handler1).toHaveBeenCalledWith({ kept: true });
    });

    it('should remove all listeners for all events when no event specified', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();

      eventBus.on('Event1', handler1);
      eventBus.on('Event2', handler2);

      eventBus.removeAllListeners();

      eventBus.emit('Event1', {});
      eventBus.emit('Event2', {});

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('typed events', () => {
    it('should work with typed event payloads', () => {
      interface TabActivatedEvent {
        tabId: number;
        url: string;
        port: number;
        timestamp: number;
      }

      const handler = vi.fn<[TabActivatedEvent], void>();

      eventBus.on<TabActivatedEvent>('TabActivated', handler);
      eventBus.emit<TabActivatedEvent>('TabActivated', {
        tabId: 1,
        url: 'http://localhost:3000',
        port: 3142,
        timestamp: Date.now(),
      });

      expect(handler).toHaveBeenCalledOnce();
      expect(handler.mock.calls[0][0]).toMatchObject({
        tabId: 1,
        url: 'http://localhost:3000',
        port: 3142,
      });
    });
  });
});
