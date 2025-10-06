import type { ISessionManager, SessionBinding } from '@browser-mcp/contracts/session';

/**
 * Session Manager implementation.
 * Manages IDE session-to-tab bindings for focused context.
 * NO MOCKS - real in-memory storage.
 */
export class SessionManager implements ISessionManager {
  private bindings = new Map<string, SessionBinding>();

  pinTab(sessionId: string, tabId: number): void {
    this.bindings.set(sessionId, {
      sessionId,
      tabId,
      pinnedAt: Date.now(),
    });
  }

  unpinTab(sessionId: string): void {
    this.bindings.delete(sessionId);
  }

  getPinnedTab(sessionId: string): number | null {
    const binding = this.bindings.get(sessionId);
    return binding ? binding.tabId : null;
  }

  getAllBindings(): SessionBinding[] {
    return Array.from(this.bindings.values());
  }

  isTabPinned(tabId: number): boolean {
    for (const binding of this.bindings.values()) {
      if (binding.tabId === tabId) {
        return true;
      }
    }
    return false;
  }

  getSessionsForTab(tabId: number): string[] {
    const sessions: string[] = [];
    for (const binding of this.bindings.values()) {
      if (binding.tabId === tabId) {
        sessions.push(binding.sessionId);
      }
    }
    return sessions;
  }

  clearSession(sessionId: string): void {
    this.bindings.delete(sessionId);
  }

  clearAll(): void {
    this.bindings.clear();
  }
}
