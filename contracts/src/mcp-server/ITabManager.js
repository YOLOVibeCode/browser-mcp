/**
 * Custom errors for tab management
 */
export class TabNotActiveError extends Error {
    constructor(tabId) {
        super(`Tab ${tabId} is not active`);
        this.name = 'TabNotActiveError';
    }
}
export class TabAlreadyActiveError extends Error {
    constructor(tabId) {
        super(`Tab ${tabId} is already active`);
        this.name = 'TabAlreadyActiveError';
    }
}
//# sourceMappingURL=ITabManager.js.map