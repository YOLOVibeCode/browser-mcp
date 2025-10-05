/**
 * Event bus interface for cross-component communication.
 * All components communicate via events (loose coupling).
 * Implementation: EventEmitter3 wrapper
 */
export interface IEventBus {
  /**
   * Emits an event with payload.
   * @param event - Event name (past-tense verb, e.g., "TabActivated")
   * @param payload - Event payload (must match EventSchema)
   */
  emit<T = unknown>(event: string, payload: T): void;

  /**
   * Subscribes to an event.
   * @param event - Event name
   * @param handler - Event handler function
   * @returns Unsubscribe function
   */
  on<T = unknown>(event: string, handler: (payload: T) => void): () => void;

  /**
   * Subscribes to an event once.
   * Handler is automatically unsubscribed after first invocation.
   */
  once<T = unknown>(event: string, handler: (payload: T) => void): void;

  /**
   * Removes a specific event handler.
   */
  off<T = unknown>(event: string, handler: (payload: T) => void): void;

  /**
   * Removes all handlers for an event.
   */
  removeAllListeners(event?: string): void;
}
