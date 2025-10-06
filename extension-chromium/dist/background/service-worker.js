var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// ../node_modules/eventemitter3/index.js
var require_eventemitter3 = __commonJS({
  "../node_modules/eventemitter3/index.js"(exports, module) {
    "use strict";
    var has = Object.prototype.hasOwnProperty;
    var prefix = "~";
    function Events() {
    }
    if (Object.create) {
      Events.prototype = /* @__PURE__ */ Object.create(null);
      if (!new Events().__proto__) prefix = false;
    }
    function EE(fn, context, once) {
      this.fn = fn;
      this.context = context;
      this.once = once || false;
    }
    function addListener(emitter, event, fn, context, once) {
      if (typeof fn !== "function") {
        throw new TypeError("The listener must be a function");
      }
      var listener = new EE(fn, context || emitter, once), evt = prefix ? prefix + event : event;
      if (!emitter._events[evt]) emitter._events[evt] = listener, emitter._eventsCount++;
      else if (!emitter._events[evt].fn) emitter._events[evt].push(listener);
      else emitter._events[evt] = [emitter._events[evt], listener];
      return emitter;
    }
    function clearEvent(emitter, evt) {
      if (--emitter._eventsCount === 0) emitter._events = new Events();
      else delete emitter._events[evt];
    }
    function EventEmitter2() {
      this._events = new Events();
      this._eventsCount = 0;
    }
    EventEmitter2.prototype.eventNames = function eventNames() {
      var names = [], events, name;
      if (this._eventsCount === 0) return names;
      for (name in events = this._events) {
        if (has.call(events, name)) names.push(prefix ? name.slice(1) : name);
      }
      if (Object.getOwnPropertySymbols) {
        return names.concat(Object.getOwnPropertySymbols(events));
      }
      return names;
    };
    EventEmitter2.prototype.listeners = function listeners(event) {
      var evt = prefix ? prefix + event : event, handlers = this._events[evt];
      if (!handlers) return [];
      if (handlers.fn) return [handlers.fn];
      for (var i = 0, l = handlers.length, ee = new Array(l); i < l; i++) {
        ee[i] = handlers[i].fn;
      }
      return ee;
    };
    EventEmitter2.prototype.listenerCount = function listenerCount(event) {
      var evt = prefix ? prefix + event : event, listeners = this._events[evt];
      if (!listeners) return 0;
      if (listeners.fn) return 1;
      return listeners.length;
    };
    EventEmitter2.prototype.emit = function emit(event, a1, a2, a3, a4, a5) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return false;
      var listeners = this._events[evt], len = arguments.length, args, i;
      if (listeners.fn) {
        if (listeners.once) this.removeListener(event, listeners.fn, void 0, true);
        switch (len) {
          case 1:
            return listeners.fn.call(listeners.context), true;
          case 2:
            return listeners.fn.call(listeners.context, a1), true;
          case 3:
            return listeners.fn.call(listeners.context, a1, a2), true;
          case 4:
            return listeners.fn.call(listeners.context, a1, a2, a3), true;
          case 5:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4), true;
          case 6:
            return listeners.fn.call(listeners.context, a1, a2, a3, a4, a5), true;
        }
        for (i = 1, args = new Array(len - 1); i < len; i++) {
          args[i - 1] = arguments[i];
        }
        listeners.fn.apply(listeners.context, args);
      } else {
        var length = listeners.length, j;
        for (i = 0; i < length; i++) {
          if (listeners[i].once) this.removeListener(event, listeners[i].fn, void 0, true);
          switch (len) {
            case 1:
              listeners[i].fn.call(listeners[i].context);
              break;
            case 2:
              listeners[i].fn.call(listeners[i].context, a1);
              break;
            case 3:
              listeners[i].fn.call(listeners[i].context, a1, a2);
              break;
            case 4:
              listeners[i].fn.call(listeners[i].context, a1, a2, a3);
              break;
            default:
              if (!args) for (j = 1, args = new Array(len - 1); j < len; j++) {
                args[j - 1] = arguments[j];
              }
              listeners[i].fn.apply(listeners[i].context, args);
          }
        }
      }
      return true;
    };
    EventEmitter2.prototype.on = function on(event, fn, context) {
      return addListener(this, event, fn, context, false);
    };
    EventEmitter2.prototype.once = function once(event, fn, context) {
      return addListener(this, event, fn, context, true);
    };
    EventEmitter2.prototype.removeListener = function removeListener(event, fn, context, once) {
      var evt = prefix ? prefix + event : event;
      if (!this._events[evt]) return this;
      if (!fn) {
        clearEvent(this, evt);
        return this;
      }
      var listeners = this._events[evt];
      if (listeners.fn) {
        if (listeners.fn === fn && (!once || listeners.once) && (!context || listeners.context === context)) {
          clearEvent(this, evt);
        }
      } else {
        for (var i = 0, events = [], length = listeners.length; i < length; i++) {
          if (listeners[i].fn !== fn || once && !listeners[i].once || context && listeners[i].context !== context) {
            events.push(listeners[i]);
          }
        }
        if (events.length) this._events[evt] = events.length === 1 ? events[0] : events;
        else clearEvent(this, evt);
      }
      return this;
    };
    EventEmitter2.prototype.removeAllListeners = function removeAllListeners(event) {
      var evt;
      if (event) {
        evt = prefix ? prefix + event : event;
        if (this._events[evt]) clearEvent(this, evt);
      } else {
        this._events = new Events();
        this._eventsCount = 0;
      }
      return this;
    };
    EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
    EventEmitter2.prototype.addListener = EventEmitter2.prototype.on;
    EventEmitter2.prefixed = prefix;
    EventEmitter2.EventEmitter = EventEmitter2;
    if ("undefined" !== typeof module) {
      module.exports = EventEmitter2;
    }
  }
});

// ../node_modules/eventemitter3/index.mjs
var import_index = __toESM(require_eventemitter3(), 1);
var eventemitter3_default = import_index.default;

// ../infrastructure/src/event-bus/EventEmitterBus.ts
var EventEmitterBus = class {
  constructor() {
    __publicField(this, "emitter");
    this.emitter = new eventemitter3_default();
  }
  emit(event, payload) {
    this.emitter.emit(event, payload);
  }
  on(event, handler) {
    this.emitter.on(event, handler);
    return () => {
      this.emitter.off(event, handler);
    };
  }
  once(event, handler) {
    this.emitter.once(event, handler);
  }
  off(event, handler) {
    this.emitter.off(event, handler);
  }
  removeAllListeners(event) {
    if (event) {
      this.emitter.removeAllListeners(event);
    } else {
      this.emitter.removeAllListeners();
    }
  }
};

// ../contracts/src/mcp-server/IPortManager.ts
var NoAvailablePortError = class extends Error {
  constructor(message = "No available ports in range 3100-3299") {
    super(message);
    this.name = "NoAvailablePortError";
  }
};
var PortAlreadyReservedError = class extends Error {
  constructor(port) {
    super(`Port ${port} is already reserved`);
    this.name = "PortAlreadyReservedError";
  }
};

// background/BrowserPortManager.ts
var BrowserPortManager = class {
  constructor() {
    __publicField(this, "DEFAULT_RANGE", [3100, 3199]);
    __publicField(this, "FALLBACK_RANGE", [3200, 3299]);
    // Maps: tabId -> port
    __publicField(this, "tabToPort", /* @__PURE__ */ new Map());
    // Reverse map: port -> tabId
    __publicField(this, "portToTab", /* @__PURE__ */ new Map());
    // Track which ports we've allocated (to avoid duplicates)
    __publicField(this, "allocatedPorts", /* @__PURE__ */ new Set());
  }
  async findAvailablePort() {
    for (let port = this.DEFAULT_RANGE[0]; port <= this.DEFAULT_RANGE[1]; port++) {
      if (!this.allocatedPorts.has(port) && !this.portToTab.has(port)) {
        return port;
      }
    }
    for (let port = this.FALLBACK_RANGE[0]; port <= this.FALLBACK_RANGE[1]; port++) {
      if (!this.allocatedPorts.has(port) && !this.portToTab.has(port)) {
        return port;
      }
    }
    throw new NoAvailablePortError();
  }
  async isPortAvailable(port) {
    return !this.portToTab.has(port) && !this.allocatedPorts.has(port);
  }
  reservePort(tabId, port) {
    const existingTabId = this.portToTab.get(port);
    if (existingTabId !== void 0 && existingTabId !== tabId) {
      throw new PortAlreadyReservedError(port);
    }
    const oldPort = this.tabToPort.get(tabId);
    if (oldPort !== void 0 && oldPort !== port) {
      this.portToTab.delete(oldPort);
      this.allocatedPorts.delete(oldPort);
    }
    this.tabToPort.set(tabId, port);
    this.portToTab.set(port, tabId);
    this.allocatedPorts.add(port);
  }
  releasePort(tabId) {
    const port = this.tabToPort.get(tabId);
    if (port !== void 0) {
      this.tabToPort.delete(tabId);
      this.portToTab.delete(port);
      this.allocatedPorts.delete(port);
    }
  }
  getPortForTab(tabId) {
    return this.tabToPort.get(tabId) ?? null;
  }
  getTabForPort(port) {
    return this.portToTab.get(port) ?? null;
  }
  getAllReservedPorts() {
    return new Map(this.tabToPort);
  }
};

// ../infrastructure/src/tab-management/TabManager.ts
var TabManager = class {
  constructor(eventBus) {
    this.eventBus = eventBus;
    // Map: tabId -> TabInfo
    __publicField(this, "activeTabs", /* @__PURE__ */ new Map());
  }
  async activateTab(tabId, url, port) {
    const virtualFilesystemURI = this.generateVirtualFilesystemURI(url);
    const tabInfo = {
      tabId,
      url,
      title: "",
      // Will be populated later when we integrate with browser APIs
      port,
      framework: null,
      // Will be detected later
      isActive: true,
      virtualFilesystemURI,
      activatedAt: Date.now()
    };
    this.activeTabs.set(tabId, tabInfo);
    const event = {
      tabId,
      url,
      port,
      timestamp: Date.now()
    };
    this.eventBus.emit("TabActivated", event);
  }
  async deactivateTab(tabId) {
    const tabInfo = this.activeTabs.get(tabId);
    if (!tabInfo) {
      return;
    }
    this.activeTabs.delete(tabId);
    const event = {
      tabId,
      timestamp: Date.now()
    };
    this.eventBus.emit("TabDeactivated", event);
  }
  getTabInfo(tabId) {
    return this.activeTabs.get(tabId) ?? null;
  }
  getAllActiveTabs() {
    return Array.from(this.activeTabs.values());
  }
  isTabActive(tabId) {
    return this.activeTabs.has(tabId);
  }
  getVirtualFilesystemURI(tabId) {
    const tabInfo = this.activeTabs.get(tabId);
    return tabInfo?.virtualFilesystemURI ?? null;
  }
  /**
   * Generates virtual filesystem URI from tab URL.
   * Example: http://localhost:3000 -> browser://tab-localhost-3000/
   * Example: https://example.com -> browser://tab-example-com/
   */
  generateVirtualFilesystemURI(url) {
    try {
      const urlObj = new URL(url);
      let host = urlObj.hostname;
      if (urlObj.port) {
        host += `-${urlObj.port}`;
      }
      const safeName = host.replace(/\./g, "-").replace(/:/g, "-");
      return `browser://tab-${safeName}/`;
    } catch {
      const safeName = url.replace(/[^a-zA-Z0-9]/g, "-");
      return `browser://tab-${safeName}/`;
    }
  }
};

// background/ConnectionStatusManager.ts
function calculateBadgeUpdate(status) {
  if (status.activeTabCount > 0) {
    const tabText = status.activeTabCount === 1 ? "tab" : "tabs";
    return {
      text: status.activeTabCount.toString(),
      backgroundColor: "#28a745",
      // Green
      title: `Browser Inspector - ${status.activeTabCount} active ${tabText}`
    };
  } else {
    return {
      text: "",
      backgroundColor: "#ff9500",
      // Orange (not used when text is empty)
      title: "Browser Inspector - Not Connected"
    };
  }
}
function applyBadgeUpdate(update, chromeAPI) {
  chromeAPI.setBadgeText({ text: update.text });
  if (update.text !== "") {
    chromeAPI.setBadgeBackgroundColor({ color: update.backgroundColor });
  }
  chromeAPI.setTitle({ title: update.title });
}

// background/service-worker.ts
var ServiceWorkerState = class {
  constructor() {
    __publicField(this, "eventBus");
    __publicField(this, "portManager");
    __publicField(this, "tabManager");
    this.eventBus = new EventEmitterBus();
    this.portManager = new BrowserPortManager();
    this.tabManager = new TabManager(this.eventBus);
    this.setupEventListeners();
  }
  setupEventListeners() {
    this.eventBus.on("TabActivated", (payload) => {
      console.log("[Service Worker] Tab activated:", payload);
    });
    this.eventBus.on("TabDeactivated", (payload) => {
      console.log("[Service Worker] Tab deactivated:", payload);
    });
    this.eventBus.on("PortAllocated", (payload) => {
      console.log("[Service Worker] Port allocated:", payload);
    });
  }
};
var state = null;
function initialize() {
  if (state) return;
  console.log("[Service Worker] Initializing Browser Inspector...");
  state = new ServiceWorkerState();
  console.log("[Service Worker] Initialized successfully");
  updateIcon(false);
}
var chromeActionAPI = {
  setBadgeText: (details) => chrome.action.setBadgeText(details),
  setBadgeBackgroundColor: (details) => chrome.action.setBadgeBackgroundColor(details),
  setTitle: (details) => chrome.action.setTitle(details)
};
function updateIcon(hasActiveConnections) {
  try {
    const activeTabCount = state?.tabManager.getAllActiveTabs().length || 0;
    const status = {
      hasActiveConnections,
      activeTabCount
    };
    const badgeUpdate = calculateBadgeUpdate(status);
    applyBadgeUpdate(badgeUpdate, chromeActionAPI);
  } catch (err) {
    console.error("[Service Worker] Error updating icon:", err);
  }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("[Service Worker] Received message:", message);
  if (!state) {
    initialize();
  }
  if (message.type === "ACTIVATE_TAB") {
    handleActivateTab(message.payload).then((result) => sendResponse({ success: true, data: result })).catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.type === "DEACTIVATE_TAB") {
    handleDeactivateTab(message.payload).then(() => sendResponse({ success: true })).catch((error) => sendResponse({ success: false, error: error.message }));
    return true;
  }
  if (message.type === "GET_TAB_INFO") {
    const tabInfo = state.tabManager.getTabInfo(message.payload.tabId);
    sendResponse({ success: true, data: tabInfo });
    return false;
  }
  if (message.type === "GET_ALL_ACTIVE_TABS") {
    const tabs = state.tabManager.getAllActiveTabs();
    sendResponse({ success: true, data: tabs });
    return false;
  }
  sendResponse({ success: false, error: "Unknown message type" });
  return false;
});
async function handleActivateTab(payload) {
  if (!state) throw new Error("Service worker not initialized");
  const { tabId, url } = payload;
  const port = await state.portManager.findAvailablePort();
  state.portManager.reservePort(tabId, port);
  state.eventBus.emit("PortAllocated", {
    port,
    tabId,
    timestamp: Date.now()
  });
  await state.tabManager.activateTab(tabId, url, port);
  updateIcon(true);
  return {
    port,
    virtualFilesystemURI: state.tabManager.getVirtualFilesystemURI(tabId)
  };
}
async function handleDeactivateTab(payload) {
  if (!state) throw new Error("Service worker not initialized");
  const { tabId } = payload;
  await state.tabManager.deactivateTab(tabId);
  state.portManager.releasePort(tabId);
  const activeTabs = state.tabManager.getAllActiveTabs();
  const hasActiveConnections = activeTabs.length > 0;
  updateIcon(hasActiveConnections);
}
initialize();
console.log("[Service Worker] Browser Inspector loaded");
//# sourceMappingURL=service-worker.js.map
