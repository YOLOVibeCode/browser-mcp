import type { ISessionManager, SessionBinding } from '@browser-mcp/contracts/session';
/**
 * Session Manager implementation.
 * Manages IDE session-to-tab bindings for focused context.
 * NO MOCKS - real in-memory storage.
 */
export declare class SessionManager implements ISessionManager {
    private bindings;
    pinTab(sessionId: string, tabId: number): void;
    unpinTab(sessionId: string): void;
    getPinnedTab(sessionId: string): number | null;
    getAllBindings(): SessionBinding[];
    isTabPinned(tabId: number): boolean;
    getSessionsForTab(tabId: number): string[];
    clearSession(sessionId: string): void;
    clearAll(): void;
}
//# sourceMappingURL=SessionManager.d.ts.map