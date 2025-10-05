import { IEventBus } from '@browser-mcp/contracts/events';
/**
 * EventEmitter3 implementation of IEventBus.
 * Provides event-driven communication between components.
 */
export declare class EventEmitterBus implements IEventBus {
    private emitter;
    constructor();
    emit<T = unknown>(event: string, payload: T): void;
    on<T = unknown>(event: string, handler: (payload: T) => void): () => void;
    once<T = unknown>(event: string, handler: (payload: T) => void): void;
    off<T = unknown>(event: string, handler: (payload: T) => void): void;
    removeAllListeners(event?: string): void;
}
//# sourceMappingURL=EventEmitterBus.d.ts.map