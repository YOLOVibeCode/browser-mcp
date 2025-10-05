/**
 * Popup UI for Browser Inspector Extension
 */
interface TabState {
    isActive: boolean;
    port?: number;
    virtualFilesystemURI?: string;
}
declare let currentTabId: number | null;
declare let currentTabUrl: string | null;
declare let tabState: TabState;
/**
 * Initialize popup
 */
declare function initialize(): Promise<void>;
/**
 * Render popup UI
 */
declare function render(): void;
/**
 * Handle activate button click
 */
declare function handleActivate(): Promise<void>;
/**
 * Handle deactivate button click
 */
declare function handleDeactivate(): Promise<void>;
/**
 * Handle copy port button click
 */
declare function handleCopyPort(port: number): Promise<void>;
/**
 * Show error message
 */
declare function showError(message: string): void;
//# sourceMappingURL=popup.d.ts.map