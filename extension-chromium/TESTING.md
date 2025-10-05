# Testing the Browser Inspector Extension

## 🚀 Quick Start

### 1. Build the Extension

```bash
cd extension-chromium
npm run build
```

This will create a `dist/` folder with the bundled extension.

### 2. Load Extension in Chrome

1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable **Developer mode** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `extension-chromium/dist/` folder
5. The extension should now appear with the name "Browser Inspector for AI"

### 3. Test Basic Functionality

#### Test Activation Flow

1. Navigate to any website (e.g., `http://localhost:3000` or `https://example.com`)
2. Click the extension icon in the toolbar
3. The popup should show:
   - Status: Inactive
   - Tab URL
   - "Activate Debugging" button
4. Click **"Activate Debugging"**
5. The popup should update to show:
   - Status: Active
   - Allocated port (e.g., 3142)
   - Virtual filesystem URI
   - "Deactivate Debugging" button

#### Test Port Allocation

1. Activate debugging on multiple tabs
2. Each tab should get a unique port (3100, 3101, 3102, etc.)
3. Check the popup on each tab to verify different ports

#### Test Deactivation

1. On an active tab, click **"Deactivate Debugging"**
2. Status should change to "Inactive"
3. The port should be released (can be reused by another tab)

### 4. Check Service Worker Logs

1. In `chrome://extensions/`, find "Browser Inspector for AI"
2. Click "service worker" link (under "Inspect views")
3. This opens DevTools for the service worker
4. Check console for logs:
   - `[Service Worker] Initializing Browser Inspector...`
   - `[Service Worker] Tab activated: { tabId: 1, url: '...', port: 3142 }`
   - `[Service Worker] Port allocated: { port: 3142, tabId: 1 }`

## 🧪 Manual Test Cases

### Test Case 1: Single Tab Activation

**Steps**:
1. Open Chrome
2. Navigate to `https://example.com`
3. Click extension icon
4. Click "Activate Debugging"

**Expected**:
- ✅ Status changes to "Active"
- ✅ Port allocated (3100-3199 range)
- ✅ Virtual FS URI shown: `browser://tab-example-com/`
- ✅ Service worker logs "Tab activated" event

### Test Case 2: Multi-Tab Support

**Steps**:
1. Open 3 different tabs (e.g., example.com, google.com, github.com)
2. Activate debugging on all 3 tabs
3. Check popup on each tab

**Expected**:
- ✅ Each tab has unique port (e.g., 3100, 3101, 3102)
- ✅ Each tab has correct virtual FS URI
- ✅ All tabs show "Active" status
- ✅ Service worker logs show 3 activations

### Test Case 3: Port Exhaustion (Edge Case)

**Steps**:
1. Activate debugging on 100 tabs (to exhaust default range 3100-3199)
2. Try to activate on tab 101

**Expected**:
- ✅ First 100 tabs use ports 3100-3199
- ✅ Tab 101 uses port 3200 (fallback range)
- ✅ System continues working smoothly

### Test Case 4: Tab Deactivation

**Steps**:
1. Activate debugging on tab 1 (gets port 3142)
2. Deactivate debugging
3. Activate debugging on tab 2

**Expected**:
- ✅ Tab 1 releases port 3142
- ✅ Tab 2 can reuse port 3142
- ✅ No port conflicts

### Test Case 5: Extension Restart

**Steps**:
1. Activate debugging on 3 tabs
2. Go to `chrome://extensions/` and click "Reload" on extension
3. Check service worker logs

**Expected**:
- ✅ Service worker restarts
- ✅ All previous activations are cleared (expected behavior)
- ✅ Tabs can be reactivated

### Test Case 6: Copy Port Button

**Steps**:
1. Activate debugging on a tab
2. Click "Copy Port" button

**Expected**:
- ✅ Port number copied to clipboard
- ✅ Button text changes to "Copied!" temporarily
- ✅ Can paste port number into AI assistant config

## 🔍 Debugging

### Service Worker Not Starting

**Problem**: Service worker shows "inactive" in `chrome://extensions/`

**Solution**:
- Click "service worker" link to activate it
- Check console for errors
- Try reloading the extension

### Popup Not Showing

**Problem**: Clicking extension icon does nothing

**Solution**:
- Check if popup.html exists in `dist/popup/`
- Check if popup.js is bundled correctly
- Right-click extension icon → Inspect Popup → Check console

### Port Allocation Failing

**Problem**: Error when activating tab

**Solution**:
- Check service worker console for errors
- Verify `BrowserPortManager` is being used (not `PortManager`)
- Check if ports 3100-3199 are blocked by firewall

## 📊 Current Test Status

**Automated Tests**: 47/47 passing ✅
- EventEmitterBus: 8 tests
- PortManager: 17 tests
- TabManager: 22 tests

**Manual Tests**: Pending (load extension and test manually)

**Browser Tests with Playwright**: Not yet implemented

## 🚧 Known Limitations

1. **No Icons**: Extension loads without icons (shows default Chrome icon)
   - Icons can be added manually to `dist/icons/`
   - Requires 16x16, 48x48, 128x128 PNG files

2. **No MCP Server**: Service worker allocates ports but doesn't start actual MCP server yet
   - Port allocation works
   - MCP server implementation coming next

3. **No Browser Protocol Integration**: Doesn't connect to Chrome DevTools Protocol yet
   - CDP integration coming next
   - Will enable actual browser inspection

4. **No Framework Detection**: Doesn't detect React/Vue/etc. yet
   - Framework detection coming next

## 🎯 Next Steps

1. **Test Extension Manually**: Load in Chrome and verify all test cases
2. **Install Playwright**: For automated browser testing
3. **Create Test Apps**: React/Vue apps for testing framework detection
4. **Implement CDP Adapter**: Connect to Chrome DevTools Protocol
5. **Implement Framework Detector**: Detect React, Vue, Blazor, etc.
6. **Implement MCP Server**: Actually start MCP server on allocated port

## 💡 Tips

- **Use DevTools**: Service worker DevTools is your best friend
- **Check Console**: All events are logged for debugging
- **Test Multi-Tab**: This is a key feature - make sure it works
- **Try Edge Cases**: Port exhaustion, rapid activate/deactivate, etc.

---

**Happy Testing!** 🎉

If you find any issues, check the service worker console first - that's where all the action happens!
