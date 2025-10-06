/**
 * Session Manager Interface
 * Manages IDE session-to-tab bindings for focused context
 */
export interface SessionBinding {
    sessionId: string;
    tabId: number;
    pinnedAt: number;
}
export interface ISessionManager {
    /**
     * Pin a tab to a specific session.
     * Only one tab can be pinned per session.
     */
    pinTab(sessionId: string, tabId: number): void;
    /**
     * Unpin the tab from a session.
     */
    unpinTab(sessionId: string): void;
    /**
     * Get the pinned tab ID for a session.
     * Returns null if no tab is pinned.
     */
    getPinnedTab(sessionId: string): number | null;
    /**
     * Get all active session bindings.
     */
    getAllBindings(): SessionBinding[];
    /**
     * Check if a tab is pinned to any session.
     */
    isTabPinned(tabId: number): boolean;
    /**
     * Get which session(s) have pinned a specific tab.
     */
    getSessionsForTab(tabId: number): string[];
    /**
     * Clear all bindings for a session.
     */
    clearSession(sessionId: string): void;
    /**
     * Clear all bindings.
     */
    clearAll(): void;
}
//# sourceMappingURL=ISessionManager.d.ts.map