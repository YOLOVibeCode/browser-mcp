import EventEmitter from 'eventemitter3';
import { IEventBus } from '@browser-mcp/contracts/events';

/**
 * EventEmitter3 implementation of IEventBus.
 * Provides event-driven communication between components.
 */
export class EventEmitterBus implements IEventBus {
  private emitter: EventEmitter;

  constructor() {
    this.emitter = new EventEmitter();
  }

  emit<T = unknown>(event: string, payload: T): void {
    this.emitter.emit(event, payload);
  }

  on<T = unknown>(event: string, handler: (payload: T) => void): () => void {
    this.emitter.on(event, handler);

    // Return unsubscribe function
    return () => {
      this.emitter.off(event, handler);
    };
  }

  once<T = unknown>(event: string, handler: (payload: T) => void): void {
    this.emitter.once(event, handler);
  }

  off<T = unknown>(event: string, handler: (payload: T) => void): void {
    this.emitter.off(event, handler);
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.emitter.removeAllListeners(event);
    } else {
      this.emitter.removeAllListeners();
    }
  }
}
