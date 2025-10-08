# 🚀 Browser MCP v3.0 - Installation Guide

## Quick Install (2 Minutes)

### Step 1: Load Extension in Chrome

1. Open Chrome and navigate to: `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right corner)
3. Click **"Load unpacked"**
4. Select this folder: `browser-mcp-extension/`
5. ✅ Extension loaded!

**Note**: You'll see a warning about icons if icon files don't exist. This is optional for testing.

### Step 2: Test the Extension

1. Click the Browser MCP extension icon in Chrome toolbar
2. You should see the popup with status
3. Click **"Test Connection"** to verify tools are working

### Step 3: Install Native Messaging Host (Optional - for IDE integration)

```bash
cd ../native-messaging-host

# Mac:
./install-mac.sh

# Linux:
./install-linux.sh

# Windows:
powershell .\install-windows.ps1
```

### Step 4: Configure Your IDE (Optional)

**Claude Desktop** (`~/Library/Application Support/Claude/claude_desktop_config.json`):
```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-host"
    }
  }
}
```

**Cursor** (`.cursor/mcp.json` in your project):
```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-host"
    }
  }
}
```

---

## Testing

### Test 1: Extension Loaded
- Open `chrome://extensions/`
- Verify "Browser MCP v3.0" is listed and enabled

### Test 2: Service Worker Running
- On the extension card, click "service worker"
- Console should show:
  ```
  [Browser MCP] Service worker starting...
  [Browser MCP] Registered 2 tools
  [Browser MCP] Service worker initialized successfully!
  ```

### Test 3: Popup Working
- Click the extension icon
- Should see modern purple UI
- Tab count should match your open tabs
- Tool count should show 2 (console tools)

### Test 4: Tab Tracking
- Open a new tab (e.g., `localhost:3000`)
- Check extension popup
- Tab should appear in "Active Tabs" list

---

## Troubleshooting

### Icons Missing
**Symptom**: Warning about missing icon files

**Fix**: Either:
1. Create icon files (see `icons/README.md`)
2. Or comment out icon references in `manifest.json` temporarily

### Service Worker Not Starting
**Symptom**: Extension loads but no logs

**Fix**:
1. Go to `chrome://extensions/`
2. Click "Reload" button on the extension
3. Click "service worker" link to see console logs

### Native Messaging Not Working
**Symptom**: Popup shows "Native host not connected"

**Fix**: This is normal if you haven't installed the native host yet. The extension works fine without it, you just can't use it from your IDE yet.

---

## Next Steps

1. ✅ **Add more tools** - Currently only 2/33 tools implemented
2. ✅ **Test with real tabs** - Open localhost apps and try getConsole tool
3. ✅ **Add remaining features** - DOM, network, storage tools
4. ✅ **Optimize** - Add filtering, compression, delta tracking

---

## Development Mode

### Auto-Reload
Chrome will NOT auto-reload the extension when you edit files. To reload:
1. Go to `chrome://extensions/`
2. Click the reload button (↻) on the extension card

### View Logs
- Service worker logs: Click "service worker" on extension card
- Popup logs: Right-click popup → Inspect

### Run Tests
```bash
# From browser-mcp-extension folder
cd tests

# Run individual tests
node tab-manager.test.js
node chrome-cdp.test.js
node mcp-server.test.js

# All tests
npm test
```

---

**Status**: ✅ Core architecture complete, ready for tool implementation!
**Version**: 3.0.0
**Architecture**: Pure JavaScript, Chrome-native, zero dependencies

