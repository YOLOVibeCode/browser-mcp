import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from './SessionManager';
describe('SessionManager', () => {
    let sessionManager;
    beforeEach(() => {
        sessionManager = new SessionManager();
    });
    describe('pinTab', () => {
        it('should pin a tab to a session', () => {
            sessionManager.pinTab('session-1', 123);
            expect(sessionManager.getPinnedTab('session-1')).toBe(123);
        });
        it('should replace existing pinned tab when pinning a new one', () => {
            sessionManager.pinTab('session-1', 123);
            sessionManager.pinTab('session-1', 456);
            expect(sessionManager.getPinnedTab('session-1')).toBe(456);
        });
        it('should allow different sessions to pin different tabs', () => {
            sessionManager.pinTab('session-1', 123);
            sessionManager.pinTab('session-2', 456);
            expect(sessionManager.getPinnedTab('session-1')).toBe(123);
            expect(sessionManager.getPinnedTab('session-2')).toBe(456);
        });
        it('should allow multiple sessions to pin the same tab', () => {
            sessionManager.pinTab('session-1', 123);
            sessionManager.pinTab('session-2', 123);
            expect(sessionManager.getPinnedTab('session-1')).toBe(123);
            expect(sessionManager.getPinnedTab('session-2')).toBe(123);
        });
    });
    describe('unpinTab', () => {
        it('should unpin a tab from a session', () => {
            sessionManager.pinTab('session-1', 123);
            sessionManager.unpinTab('session-1');
            expect(sessionManager.getPinnedTab('session-1')).toBeNull();
        });
        it('should not affect other sessions when unpinning', () => {
            sessionManager.pinTab('session-1', 123);
            sessionManager.pinTab('session-2', 456);
            sessionManager.unpinTab('session-1');
            expect(sessionManager.getPinnedTab('session-1')).toBeNull();
            expect(sessionManager.getPinnedTab('session-2')).toBe(456);
        });
        it('should handle unpinning non-existent session gracefully', () => {
            expect(() => sessionManager.unpinTab('non-existent')).not.toThrow();
        });
    });
    describe('getPinnedTab', () => {
        it('should return null for session with no pinned tab', () => {
            expect(sessionManager.getPinnedTab('session-1')).toBeNull();
        });
        it('should return the pinned tab ID', () => {
            sessionManager.pinTab('session-1', 123);
            expect(sessionManager.getPinnedTab('session-1')).toBe(123);
        });
    });
    describe('getAllBindings', () => {
        it('should return empty array when no bindings exist', () => {
            expect(sessionManager.getAllBindings()).toEqual([]);
        });
        it('should return all active bindings', () => {
            sessionManager.pinTab('session-1', 123);
            sessionManager.pinTab('session-2', 456);
            const bindings = sessionManager.getAllBindings();
            expect(bindings).toHaveLength(2);
            expect(bindings[0].sessionId).toBe('session-1');
            expect(bindings[0].tabId).toBe(123);
            expect(bindings[1].sessionId).toBe('session-2');
            expect(bindings[1].tabId).toBe(456);
        });
        it('should include timestamp for each binding', () => {
            const beforeTime = Date.now();
            sessionManager.pinTab('session-1', 123);
            const afterTime = Date.now();
            const bindings = sessionManager.getAllBindings();
            expect(bindings[0].pinnedAt).toBeGreaterThanOrEqual(beforeTime);
            expect(bindings[0].pinnedAt).toBeLessThanOrEqual(afterTime);
        });
    });
    describe('isTabPinned', () => {
        it('should return false when tab is not pinned', () => {
            expect(sessionManager.isTabPinned(123)).toBe(false);
        });
        it('should return true when tab is pinned to any session', () => {
            sessionManager.pinTab('session-1', 123);
            expect(sessionManager.isTabPinned(123)).toBe(true);
        });
        it('should return true when tab is pinned to multiple sessions', () => {
            sessionManager.pinTab('session-1', 123);
            sessionManager.pinTab('session-2', 123);
            expect(sessionManager.isTabPinned(123)).toBe(true);
        });
        it('should return false after tab is unpinned from all sessions', () => {
            sessionManager.pinTab('session-1', 123);
            sessionManager.unpinTab('session-1');
            expect(sessionManager.isTabPinned(123)).toBe(false);
        });
    });
    describe('getSessionsForTab', () => {
        it('should return empty array when tab is not pinned', () => {
            expect(sessionManager.getSessionsForTab(123)).toEqual([]);
        });
        it('should return single session when tab is pinned once', () => {
            sessionManager.pinTab('session-1', 123);
            expect(sessionManager.getSessionsForTab(123)).toEqual(['session-1']);
        });
        it('should return multiple sessions when tab is pinned to multiple sessions', () => {
            sessionManager.pinTab('session-1', 123);
            sessionManager.pinTab('session-2', 123);
            sessionManager.pinTab('session-3', 123);
            const sessions = sessionManager.getSessionsForTab(123);
            expect(sessions).toHaveLength(3);
            expect(sessions).toContain('session-1');
            expect(sessions).toContain('session-2');
            expect(sessions).toContain('session-3');
        });
    });
    describe('clearSession', () => {
        it('should remove all bindings for a session', () => {
            sessionManager.pinTab('session-1', 123);
            sessionManager.clearSession('session-1');
            expect(sessionManager.getPinnedTab('session-1')).toBeNull();
        });
        it('should not affect other sessions', () => {
            sessionManager.pinTab('session-1', 123);
            sessionManager.pinTab('session-2', 456);
            sessionManager.clearSession('session-1');
            expect(sessionManager.getPinnedTab('session-1')).toBeNull();
            expect(sessionManager.getPinnedTab('session-2')).toBe(456);
        });
        it('should handle clearing non-existent session gracefully', () => {
            expect(() => sessionManager.clearSession('non-existent')).not.toThrow();
        });
    });
    describe('clearAll', () => {
        it('should remove all bindings', () => {
            sessionManager.pinTab('session-1', 123);
            sessionManager.pinTab('session-2', 456);
            sessionManager.pinTab('session-3', 789);
            sessionManager.clearAll();
            expect(sessionManager.getAllBindings()).toEqual([]);
            expect(sessionManager.getPinnedTab('session-1')).toBeNull();
            expect(sessionManager.getPinnedTab('session-2')).toBeNull();
            expect(sessionManager.getPinnedTab('session-3')).toBeNull();
        });
        it('should handle clearing when no bindings exist', () => {
            expect(() => sessionManager.clearAll()).not.toThrow();
        });
    });
});
//# sourceMappingURL=SessionManager.test.js.map