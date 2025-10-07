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

  const timestamp = new Date().toISOString();
  console.log(`\n${'='.repeat(60)}`);
  console.log(`[${timestamp}] 🚀 Initializing Browser Inspector Extension`);
  console.log(`${'='.repeat(60)}\n`);

  state = new ServiceWorkerState();

  console.log('✅ Service Worker initialized successfully');
  console.log(`   - Event Bus: Ready`);
  console.log(`   - Port Manager: Ready`);
  console.log(`   - Tab Manager: Ready`);
  console.log('');

  // Set initial icon to inactive state
  updateIcon(false);

  console.log('🎯 Extension ready to connect tabs');
  console.log(`${'='.repeat(60)}\n`);
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
  const timestamp = new Date().toISOString();
  const messageId = Math.random().toString(36).substr(2, 9);

  console.log(`\n${'─'.repeat(60)}`);
  console.log(`📨 [${timestamp}] MESSAGE RECEIVED [${messageId}]`);
  console.log(`   Type: ${message.type}`);
  console.log(`   From: ${sender.tab ? `Tab ${sender.tab.id}` : 'Popup/Extension'}`);
  console.log(`   Payload: ${JSON.stringify(message.payload || {}, null, 2)}`);

  if (!state) {
    console.log('   ⚠️  Service worker not initialized, initializing now...');
    initialize();
  }

  if (message.type === 'ACTIVATE_TAB') {
    console.log(`   ↳ Activating tab ${message.payload.tabId}...`);
    handleActivateTab(message.payload)
      .then((result) => {
        console.log(`✅ [${new Date().toISOString()}] MESSAGE RESPONSE [${messageId}]`);
        console.log(`   Status: Success`);
        console.log(`   Result: ${JSON.stringify(result, null, 2)}`);
        console.log(`${'─'.repeat(60)}\n`);
        sendResponse({ success: true, data: result });
      })
      .catch((error) => {
        console.error(`❌ [${new Date().toISOString()}] MESSAGE ERROR [${messageId}]`);
        console.error(`   Error: ${error.message}`);
        console.error(`   Stack: ${error.stack || 'No stack trace'}`);
        console.error(`${'─'.repeat(60)}\n`);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Keep channel open for async response
  }

  if (message.type === 'DEACTIVATE_TAB') {
    console.log(`   ↳ Deactivating tab ${message.payload.tabId}...`);
    handleDeactivateTab(message.payload)
      .then(() => {
        console.log(`✅ [${new Date().toISOString()}] MESSAGE RESPONSE [${messageId}]`);
        console.log(`   Status: Success`);
        console.log(`${'─'.repeat(60)}\n`);
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error(`❌ [${new Date().toISOString()}] MESSAGE ERROR [${messageId}]`);
        console.error(`   Error: ${error.message}`);
        console.error(`${'─'.repeat(60)}\n`);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'GET_TAB_INFO') {
    console.log(`   ↳ Getting info for tab ${message.payload.tabId}...`);
    const tabInfo = state!.tabManager.getTabInfo(message.payload.tabId);
    console.log(`✅ [${new Date().toISOString()}] MESSAGE RESPONSE [${messageId}]`);
    console.log(`   Status: Success`);
    console.log(`   Tab Info: ${tabInfo ? 'Found' : 'Not found'}`);
    console.log(`${'─'.repeat(60)}\n`);
    sendResponse({ success: true, data: tabInfo });
    return false;
  }

  if (message.type === 'GET_ALL_ACTIVE_TABS') {
    console.log(`   ↳ Getting all active tabs...`);
    const tabs = state!.tabManager.getAllActiveTabs();
    console.log(`✅ [${new Date().toISOString()}] MESSAGE RESPONSE [${messageId}]`);
    console.log(`   Status: Success`);
    console.log(`   Active Tabs: ${tabs.length}`);
    console.log(`${'─'.repeat(60)}\n`);
    sendResponse({ success: true, data: tabs });
    return false;
  }

  console.error(`❌ [${new Date().toISOString()}] MESSAGE ERROR [${messageId}]`);
  console.error(`   Error: Unknown message type: ${message.type}`);
  console.error(`${'─'.repeat(60)}\n`);
  sendResponse({ success: false, error: 'Unknown message type' });
  return false;
});

/**
 * Handle tab activation request
 */
async function handleActivateTab(payload: { tabId: number; url: string }): Promise<any> {
  if (!state) throw new Error('Service worker not initialized');

  const { tabId, url } = payload;

  console.log(`   🔍 Finding available port...`);
  const port = await state.portManager.findAvailablePort();
  console.log(`   ✓ Port found: ${port}`);

  console.log(`   🔒 Reserving port ${port} for tab ${tabId}...`);
  state.portManager.reservePort(tabId, port);
  console.log(`   ✓ Port reserved`);

  console.log(`   📡 Emitting PortAllocated event...`);
  state.eventBus.emit('PortAllocated', {
    port,
    tabId,
    timestamp: Date.now(),
  });

  console.log(`   🎯 Activating tab in TabManager...`);
  await state.tabManager.activateTab(tabId, url, port);
  const virtualURI = state.tabManager.getVirtualFilesystemURI(tabId);
  console.log(`   ✓ Tab activated`);
  console.log(`   ✓ Virtual FS URI: ${virtualURI}`);

  console.log(`   🎨 Updating extension icon...`);
  updateIcon(true);
  console.log(`   ✓ Icon updated`);

  const result = {
    port,
    virtualFilesystemURI: virtualURI,
  };

  console.log(`   ✨ Tab activation complete!`);
  return result;
}

/**
 * Handle tab deactivation request
 */
async function handleDeactivateTab(payload: { tabId: number }): Promise<void> {
  if (!state) throw new Error('Service worker not initialized');

  const { tabId } = payload;

  console.log(`   🔓 Deactivating tab in TabManager...`);
  await state.tabManager.deactivateTab(tabId);
  console.log(`   ✓ Tab deactivated`);

  console.log(`   🔓 Releasing port for tab ${tabId}...`);
  state.portManager.releasePort(tabId);
  console.log(`   ✓ Port released`);

  const activeTabs = state.tabManager.getAllActiveTabs();
  const hasActiveConnections = activeTabs.length > 0;
  console.log(`   📊 Active tabs remaining: ${activeTabs.length}`);

  console.log(`   🎨 Updating extension icon...`);
  updateIcon(hasActiveConnections);
  console.log(`   ✓ Icon updated`);

  console.log(`   ✨ Tab deactivation complete!`);
}

/**
 * Initialize on service worker startup
 */
initialize();

console.log('[Service Worker] Browser Inspector loaded');
