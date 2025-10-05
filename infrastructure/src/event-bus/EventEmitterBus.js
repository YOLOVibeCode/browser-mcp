import EventEmitter from 'eventemitter3';
/**
 * EventEmitter3 implementation of IEventBus.
 * Provides event-driven communication between components.
 */
export class EventEmitterBus {
    emitter;
    constructor() {
        this.emitter = new EventEmitter();
    }
    emit(event, payload) {
        this.emitter.emit(event, payload);
    }
    on(event, handler) {
        this.emitter.on(event, handler);
        // Return unsubscribe function
        return () => {
            this.emitter.off(event, handler);
        };
    }
    once(event, handler) {
        this.emitter.once(event, handler);
    }
    off(event, handler) {
        this.emitter.off(event, handler);
    }
    removeAllListeners(event) {
        if (event) {
            this.emitter.removeAllListeners(event);
        }
        else {
            this.emitter.removeAllListeners();
        }
    }
}
//# sourceMappingURL=EventEmitterBus.js.map