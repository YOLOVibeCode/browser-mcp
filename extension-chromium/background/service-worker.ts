/**
 * Background Service Worker for Browser Inspector Extension
 * Hosts the MCP server and manages tab lifecycle
 */

// Import our infrastructure implementations
// Note: In production, these would be bundled
import EventEmitter from 'eventemitter3';
import { IEventBus } from '../../contracts/src/events/IEventBus';
import { IPortManager } from '../../contracts/src/mcp-server/IPortManager';
import { ITabManager } from '../../contracts/src/mcp-server/ITabManager';

// Import implementations
import { EventEmitterBus } from '../../infrastructure/src/event-bus/EventEmitterBus';
import { BrowserPortManager } from './BrowserPortManager';
import { TabManager } from '../../infrastructure/src/tab-management/TabManager';

// Import connection status manager (ISP-compliant, testable)
import {
  calculateBadgeUpdate,
  applyBadgeUpdate,
  type IConnectionStatus,
  type IChromeActionAPI
} from './ConnectionStatusManager';

/**
 * Service Worker State
 */
class ServiceWorkerState {
  public eventBus: IEventBus;
  public portManager: IPortManager;
  public tabManager: ITabManager;

  constructor() {
    // Initialize event bus (real EventEmitter3)
    this.eventBus = new EventEmitterBus();

    // Initialize port manager (browser-compatible version)
    this.portManager = new BrowserPortManager();

    // Initialize tab manager (with event bus)
    this.tabManager = new TabManager(this.eventBus);

    // Set up event listeners
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Listen to TabActivated events
    this.eventBus.on('TabActivated', (payload) => {
      console.log('[Service Worker] Tab activated:', payload);
    });

    // Listen to TabDeactivated events
    this.eventBus.on('TabDeactivated', (payload) => {
      console.log('[Service Worker] Tab deactivated:', payload);
    });

    // Listen to PortAllocated events
    this.eventBus.on('PortAllocated', (payload) => {
      console.log('[Service Worker] Port allocated:', payload);
    });
  }
}

// Global state
let state: ServiceWorkerState | null = null;

/**
 * Initialize service worker
 */
function initialize(): void {
  if (state) return;

  console.log('[Service Worker] Initializing Browser Inspector...');
  state = new ServiceWorkerState();
  console.log('[Service Worker] Initialized successfully');

  // Set initial icon to inactive state
  updateIcon(false);
}

/**
 * Chrome API wrapper for testing
 */
const chromeActionAPI: IChromeActionAPI = {
  setBadgeText: (details) => chrome.action.setBadgeText(details),
  setBadgeBackgroundColor: (details) => chrome.action.setBadgeBackgroundColor(details),
  setTitle: (details) => chrome.action.setTitle(details)
};

/**
 * Update extension icon based on connection state
 * Now uses ISP-compliant ConnectionStatusManager for testability
 */
function updateIcon(hasActiveConnections: boolean): void {
  try {
    const activeTabCount = state?.tabManager.getAllActiveTabs().length || 0;
    const status: IConnectionStatus = {
      hasActiveConnections,
      activeTabCount
    };

    const badgeUpdate = calculateBadgeUpdate(status);
    applyBadgeUpdate(badgeUpdate, chromeActionAPI);
  } catch (err) {
    console.error('[Service Worker] Error updating icon:', err);
  }
}

/**
 * Handle messages from popup or content scripts
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Service Worker] Received message:', message);

  if (!state) {
    initialize();
  }

  if (message.type === 'ACTIVATE_TAB') {
    handleActivateTab(message.payload)
      .then((result) => sendResponse({ success: true, data: result }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true; // Keep channel open for async response
  }

  if (message.type === 'DEACTIVATE_TAB') {
    handleDeactivateTab(message.payload)
      .then(() => sendResponse({ success: true }))
      .catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'GET_TAB_INFO') {
    const tabInfo = state!.tabManager.getTabInfo(message.payload.tabId);
    sendResponse({ success: true, data: tabInfo });
    return false;
  }

  if (message.type === 'GET_ALL_ACTIVE_TABS') {
    const tabs = state!.tabManager.getAllActiveTabs();
    sendResponse({ success: true, data: tabs });
    return false;
  }

  sendResponse({ success: false, error: 'Unknown message type' });
  return false;
});

/**
 * Handle tab activation request
 */
async function handleActivateTab(payload: { tabId: number; url: string }): Promise<any> {
  if (!state) throw new Error('Service worker not initialized');

  const { tabId, url } = payload;

  // Find available port
  const port = await state.portManager.findAvailablePort();

  // Reserve port for tab
  state.portManager.reservePort(tabId, port);

  // Emit PortAllocated event
  state.eventBus.emit('PortAllocated', {
    port,
    tabId,
    timestamp: Date.now(),
  });

  // Activate tab
  await state.tabManager.activateTab(tabId, url, port);

  // Update icon to show active connection
  updateIcon(true);

  return {
    port,
    virtualFilesystemURI: state.tabManager.getVirtualFilesystemURI(tabId),
  };
}

/**
 * Handle tab deactivation request
 */
async function handleDeactivateTab(payload: { tabId: number }): Promise<void> {
  if (!state) throw new Error('Service worker not initialized');

  const { tabId } = payload;

  // Deactivate tab
  await state.tabManager.deactivateTab(tabId);

  // Release port
  state.portManager.releasePort(tabId);

  // Check if any tabs are still active
  const activeTabs = state.tabManager.getAllActiveTabs();
  const hasActiveConnections = activeTabs.length > 0;

  // Update icon based on remaining connections
  updateIcon(hasActiveConnections);
}

/**
 * Initialize on service worker startup
 */
initialize();

console.log('[Service Worker] Browser Inspector loaded');
