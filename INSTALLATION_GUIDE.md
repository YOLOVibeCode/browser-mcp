# Browser MCP - Complete Installation & Setup Guide

**Step-by-step guide with verification at each stage**

---

## ⚡ Quick Install (Recommended)

**One-liner installation that auto-configures your IDE:**

### Mac/Linux:
```bash
curl -fsSL https://raw.githubusercontent.com/YOLOVibeCode/browser-mcp/main/install-mcp.sh | bash
```

### Windows (PowerShell):
```powershell
iwr -useb https://raw.githubusercontent.com/YOLOVibeCode/browser-mcp/main/install-mcp.bat | iex
```

**What it does:**
- ✅ Verifies MCP server exists
- ✅ Detects your operating system
- ✅ Prompts for IDE selection (Claude/Cursor/Both)
- ✅ Backs up existing configs
- ✅ Writes IDE configuration files
- ✅ Verifies Node.js installation
- ✅ Tests MCP server functionality
- ✅ Provides next steps

**After running:** Skip to [Part 3: Install Chrome Extension](#part-3-install-chrome-extension)

---

## 📋 Prerequisites

Before starting, make sure you have:
- ✅ Node.js v18+ installed
- ✅ npm installed
- ✅ Chrome or Chromium browser
- ✅ Claude Desktop or Cursor IDE

---

## 📖 Manual Installation

If you prefer manual installation or need to understand each step, follow the detailed guide below.

---

## Part 1: Install Dependencies

### Step 1.1: Install Project Dependencies

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp
npm install
```

**✅ VERIFY:** You should see:
- No error messages
- `node_modules` folder created
- `package-lock.json` updated

### Step 1.2: Install Companion App Dependencies

```bash
cd companion-app
npm install
```

**✅ VERIFY:** Check that these packages were installed:
```bash
npm list express open
```

You should see:
```
├── express@4.18.2
└── open@10.0.0
```

---

## Part 2: Build All Components

### Step 2.1: Build Contracts

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/contracts
npm run build
```

**✅ VERIFY:**
- No TypeScript errors
- `dist/` folder created with `.js` and `.d.ts` files

### Step 2.2: Build Infrastructure

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/infrastructure
npm run build
```

**✅ VERIFY:**
- No TypeScript errors
- `dist/` folder created

### Step 2.3: Build MCP Server

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server
npm run build
```

**✅ VERIFY:**
- No TypeScript errors
- `dist/index.js` exists
- Check it: `ls -la dist/index.js`

### Step 2.4: Build Chrome Extension

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/extension-chromium
npm run build
```

**✅ VERIFY:**
- Output says "Build complete!"
- `dist/` folder exists with:
  - `service-worker.js`
  - `popup.html`
  - `popup.js`
  - `manifest.json`

Check: `ls -la dist/`

---

## Part 3: Install Chrome Extension

### Step 3.1: Open Chrome Extensions Page

1. Open Chrome browser
2. Navigate to: `chrome://extensions/`
3. Enable **"Developer mode"** toggle (top-right corner)

**✅ VERIFY:** You see "Load unpacked" button appears

### Step 3.2: Load the Extension

1. Click **"Load unpacked"**
2. Navigate to: `/Users/xcode/Documents/YOLOProjects/browser-mcp/extension-chromium/dist`
3. Click **"Select"**

**✅ VERIFY:**
- Extension appears in the list
- Name: "Browser Inspector"
- No error messages (red text)
- Extension icon appears in Chrome toolbar (puzzle piece icon → pin it)

### Step 3.3: Check Service Worker

1. On the extension card, click **"service worker"** link (blue text)
2. DevTools opens showing the service worker console

**✅ VERIFY:** You should see in the console:
```
============================================================
[timestamp] 🚀 Initializing Browser Inspector Extension
============================================================

✅ Service Worker initialized successfully
   - Event Bus: Ready
   - Port Manager: Ready
   - Tab Manager: Ready

🎯 Extension ready to connect tabs
============================================================

[Service Worker] Browser Inspector loaded
```

---

## Part 4: Test Companion App

### Step 4.1: Start Companion App

Open a new terminal and run:

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/companion-app
node index.js
```

**✅ VERIFY:** You should see:
```
🚀 Browser MCP Companion App

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Started at: [timestamp]
   Node version: v20.19.1
   Platform: darwin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔄 Starting servers...

✅ Health check server started
   Port: 3100
   URL: http://localhost:3100
   Ready at: [timestamp]
   Startup time: ~4ms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 All systems ready!

🔍 Debug Mode: ON
   - Health check requests will be logged
   - Watch this console for connection attempts
```

### Step 4.2: Test Health Check

In a browser or new terminal:
```bash
curl http://localhost:3100/health
```

**✅ VERIFY:**
- Response: `{"status":"ok","server":"running","port":3100,"timestamp":"..."}`
- Companion app terminal shows health check log:
```
──────────────────────────────────────────────────
💓 [timestamp] HEALTH CHECK
   Client IP: ::1
   User-Agent: curl/...
   Status: OK
──────────────────────────────────────────────────
```

**⚠️ KEEP THIS TERMINAL OPEN** - Leave the companion app running

---

## Part 5: Test Chrome Extension Connection

### Step 5.1: Open a Test Website

1. Open a new Chrome tab
2. Navigate to any website (e.g., `https://example.com`)

### Step 5.2: Open Extension Popup

1. Click the **Browser Inspector** icon in Chrome toolbar
2. The popup opens showing the tab connection manager

**✅ VERIFY:** You see:
- Current tab URL
- "Connect This Tab" button
- Link to "🧪 Test MCP Server"

### Step 5.3: View Service Worker Logs (Optional)

1. Keep the Service Worker DevTools open (from Part 3.3)
2. Go back to your test tab
3. Try clicking around in the popup

**✅ VERIFY:** You should see message logs in the service worker console when interacting with the popup

---

## Part 6: Configure Claude Desktop

### Step 6.1: Locate Claude Desktop Config

The config file location depends on your OS:
- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

Check if it exists:
```bash
# macOS/Linux
ls -la ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Step 6.2: Edit or Create Config File

Open the config file in your editor:
```bash
# macOS
code ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Or use any text editor:
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### Step 6.3: Add Browser MCP Server

Add this configuration (replace the path if needed):

```json
{
  "mcpServers": {
    "browser-inspector": {
      "command": "node",
      "args": [
        "/Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

**⚠️ IMPORTANT:** If you already have other MCP servers configured, add the `browser-inspector` entry inside the existing `mcpServers` object.

### Step 6.4: Verify Path

Make sure the path in the config points to the built MCP server:
```bash
ls -la /Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server/dist/index.js
```

**✅ VERIFY:** File exists and is executable

### Step 6.5: Restart Claude Desktop

1. **Quit** Claude Desktop completely (Cmd+Q on macOS)
2. **Restart** Claude Desktop

**✅ VERIFY:** After restart, check Claude Desktop:
- Look for MCP server indicators in the UI
- Check if "browser-inspector" appears in available tools/resources

---

## Part 7: Configure Cursor IDE

### Step 7.1: Locate Cursor Config

The config file is at:
- **macOS/Linux**: `~/.cursor/mcp.json`
- **Windows**: `%USERPROFILE%\.cursor\mcp.json`

Check if it exists:
```bash
ls -la ~/.cursor/mcp.json
```

### Step 7.2: Create or Edit Config

```bash
mkdir -p ~/.cursor
code ~/.cursor/mcp.json
```

### Step 7.3: Add Browser MCP Server

```json
{
  "mcpServers": {
    "browser-inspector": {
      "command": "node",
      "args": [
        "/Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Step 7.4: Restart Cursor

1. **Quit** Cursor completely
2. **Restart** Cursor

**✅ VERIFY:** MCP server should be available in Cursor's AI features

---

## Part 8: Test Complete System

### Step 8.1: Check All Components Are Running

Open multiple terminals and verify:

**Terminal 1 - Companion App:**
```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/companion-app
node index.js
```
Status: Should show "All systems ready!"

**Terminal 2 - Check MCP Server Logs:**
- Open Claude Desktop or Cursor
- MCP server should auto-start
- Check logs for initialization messages

**Chrome:**
- Extension loaded at `chrome://extensions/`
- Service worker running (no errors)
- Test website open

### Step 8.2: Connect a Tab

1. In Chrome, navigate to: `https://example.com`
2. Click **Browser Inspector** extension icon
3. The popup opens with setup wizard
4. Go through the wizard to configure your IDE

**✅ VERIFY IN SERVICE WORKER CONSOLE:**
```
────────────────────────────────────────────────────────────
📨 [timestamp] MESSAGE RECEIVED [abc123]
   Type: ACTIVATE_TAB
   From: Popup/Extension
   Payload: { "tabId": 123, "url": "https://example.com" }
   ↳ Activating tab 123...
   🔍 Finding available port...
   ✓ Port found: 9222
   ...
   ✨ Tab activation complete!
✅ [timestamp] MESSAGE RESPONSE [abc123]
   Status: Success
────────────────────────────────────────────────────────────
```

**✅ VERIFY IN COMPANION APP TERMINAL:**
```
──────────────────────────────────────────────────
💓 [timestamp] HEALTH CHECK
   Client IP: ::1
   User-Agent: Mozilla/5.0...
   Status: OK
──────────────────────────────────────────────────
```

### Step 8.3: Test MCP Server with Extension Test Panel

**RECOMMENDED:** Use the built-in test panel first:

1. In Chrome, click **Browser Inspector** extension icon
2. Click **"🧪 Test MCP Server"** link
3. Click **"▶ Run All Tests"**

**✅ VERIFY:** All 6 tests should pass:
1. ✓ Server Initialization
2. ✓ List Available Tools (6 tools)
3. ✓ List Active Tabs
4. ✓ List Available Resources
5. ✓ Session Bindings
6. ✓ List Prompts (1 prompt)

Each test shows the actual MCP response data when expanded.

### Step 8.4: Test MCP Tools in Claude/Cursor

Open Claude Desktop or Cursor and try:

**Test prompt:**
```
Can you list the available browser inspection tools?
```

**✅ VERIFY IN MCP SERVER TERMINAL:**
```
────────────────────────────────────────────────────────────
📥 [timestamp] REQUEST ID: 1
   Method: tools/list
   Params: {}
   ↳ Found 6 tools
✅ [timestamp] RESPONSE ID: 1
   Status: Success
────────────────────────────────────────────────────────────
```

You should see 6 tools:
1. `listActiveTabs`
2. `getTabInfo`
3. `pinTab`
4. `unpinTab`
5. `getPinnedTab`
6. `listSessionBindings`

---

## 🎉 Success!

If all verifications passed, your Browser MCP is fully installed and working!

---

## 🐛 Troubleshooting

### Extension Not Loading

**Problem:** Extension shows errors in Chrome
**Solution:**
1. Check `extension-chromium/dist/` exists
2. Rebuild: `cd extension-chromium && npm run build`
3. Remove and reload extension in Chrome

### Companion App Won't Start

**Problem:** Port 3100 already in use
**Solution:**
```bash
lsof -ti:3100 | xargs kill
```

### MCP Server Not Connecting in Claude/Cursor

**Problem:** IDE doesn't see the MCP server
**Solutions:**
1. Verify config file path is correct
2. Check MCP server was built: `ls mcp-server/dist/index.js`
3. Test manually: `node mcp-server/dist/index.js`
4. Completely restart the IDE (quit and reopen)

### No Logs Appearing

**Problem:** Expected debug logs not showing
**Solution:**
1. Service Worker: Make sure DevTools is open for service worker
2. MCP Server: Check stderr output (logs go to stderr)
3. Companion App: Should log to stdout in terminal

---

## 📝 Quick Start Commands

Once everything is installed, use these to start:

```bash
# Terminal 1: Start companion app
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/companion-app
node index.js

# Terminal 2: Test MCP server manually (optional)
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server
node dist/index.js

# Chrome: Extension should auto-load if installed
# Claude/Cursor: MCP server auto-starts when IDE opens
```

---

## 🔍 Monitoring & Debugging

### View All Logs

1. **Companion App**: Terminal where you ran `node index.js`
2. **Extension Service Worker**: `chrome://extensions/` → Click "service worker"
3. **MCP Server**: Appears in Claude/Cursor console or terminal if run manually
4. **Extension Popup**: Right-click popup → "Inspect"

### Common Log Patterns

**Successful Connection:**
- Companion app shows health checks
- Service worker shows tab activation
- MCP server shows tool/resource requests

**Failed Connection:**
- Check for error messages (red ❌ symbols)
- Look for stack traces
- Verify all three components are running

---

Need help? Check the logs first - they now show exactly what's happening at each step!
