/**
 * Session Manager implementation.
 * Manages IDE session-to-tab bindings for focused context.
 * NO MOCKS - real in-memory storage.
 */
export class SessionManager {
    bindings = new Map();
    pinTab(sessionId, tabId) {
        this.bindings.set(sessionId, {
            sessionId,
            tabId,
            pinnedAt: Date.now(),
        });
    }
    unpinTab(sessionId) {
        this.bindings.delete(sessionId);
    }
    getPinnedTab(sessionId) {
        const binding = this.bindings.get(sessionId);
        return binding ? binding.tabId : null;
    }
    getAllBindings() {
        return Array.from(this.bindings.values());
    }
    isTabPinned(tabId) {
        for (const binding of this.bindings.values()) {
            if (binding.tabId === tabId) {
                return true;
            }
        }
        return false;
    }
    getSessionsForTab(tabId) {
        const sessions = [];
        for (const binding of this.bindings.values()) {
            if (binding.tabId === tabId) {
                sessions.push(binding.sessionId);
            }
        }
        return sessions;
    }
    clearSession(sessionId) {
        this.bindings.delete(sessionId);
    }
    clearAll() {
        this.bindings.clear();
    }
}
//# sourceMappingURL=SessionManager.js.map