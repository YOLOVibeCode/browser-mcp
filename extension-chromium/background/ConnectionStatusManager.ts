/**
 * Connection Status Manager - Pure business logic for managing connection status and badge updates
 * Follows ISP (Interface Segregation Principle) by separating concerns
 */

export interface IConnectionStatus {
  hasActiveConnections: boolean;
  activeTabCount: number;
}

export interface IBadgeUpdate {
  text: string;
  backgroundColor: string;
  title: string;
}

/**
 * Pure function to calculate badge update based on connection status
 * This can be tested without Chrome API dependencies
 */
export function calculateBadgeUpdate(status: IConnectionStatus): IBadgeUpdate {
  if (status.activeTabCount > 0) {
    const tabText = status.activeTabCount === 1 ? 'tab' : 'tabs';
    return {
      text: status.activeTabCount.toString(),
      backgroundColor: '#28a745', // Green
      title: `Browser Inspector - ${status.activeTabCount} active ${tabText}`
    };
  } else {
    return {
      text: '',
      backgroundColor: '#ff9500', // Orange (not used when text is empty)
      title: 'Browser Inspector - Not Connected'
    };
  }
}

/**
 * Pure function to determine if we should show connected state
 */
export function isConnected(activeTabCount: number): boolean {
  return activeTabCount > 0;
}

/**
 * Pure function to format connection status message
 */
export function formatConnectionStatus(activeTabCount: number): string {
  if (activeTabCount === 0) {
    return 'Not Connected';
  } else if (activeTabCount === 1) {
    return 'Connected to 1 tab';
  } else {
    return `Connected to ${activeTabCount} tabs`;
  }
}

/**
 * Chrome API wrapper - handles actual Chrome API calls
 * This is separated so we can mock it in tests
 */
export interface IChromeActionAPI {
  setBadgeText(details: { text: string }): void;
  setBadgeBackgroundColor(details: { color: string }): void;
  setTitle(details: { title: string }): void;
}

/**
 * Apply badge update to Chrome extension using the API wrapper
 */
export function applyBadgeUpdate(update: IBadgeUpdate, chromeAPI: IChromeActionAPI): void {
  chromeAPI.setBadgeText({ text: update.text });
  if (update.text !== '') {
    chromeAPI.setBadgeBackgroundColor({ color: update.backgroundColor });
  }
  chromeAPI.setTitle({ title: update.title });
}
