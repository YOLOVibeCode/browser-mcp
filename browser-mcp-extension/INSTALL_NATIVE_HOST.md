# 🚀 Install Native Messaging Host - Quick Guide

## What Does It Do?

**The Native Messaging Host connects your Chrome extension to your IDE** (Claude Desktop, Cursor, Windsurf, etc.)

**Without it:** Extension works only in Chrome browser
**With it:** Your AI can debug websites automatically! 🎉

---

## Installation (3 Steps)

### Step 1: Get Your Extension ID

1. Go to `chrome://extensions/`
2. Find "Browser MCP" extension
3. Look for the ID (long string like: `abcdefghijklmnopqrstuvwxyz123456`)
4. **Copy this ID** - you'll need it!

**Tip:** Enable "Developer mode" to see the ID clearly

---

### Step 2: Run the Installer

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/native-messaging-host
./install-mac.sh
```

When prompted, **paste your extension ID**.

**What this does:**
- ✅ Installs the native host script to `/usr/local/bin/`
- ✅ Creates Chrome configuration file
- ✅ Enables communication between Chrome and your IDE

---

### Step 3: Configure Your IDE

Choose your IDE:

#### For Claude Desktop:

Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "/usr/local/bin/browser-mcp-host"
    }
  }
}
```

#### For Cursor:

Edit: `~/.cursor/mcp_settings.json`

```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "/usr/local/bin/browser-mcp-host"
    }
  }
}
```

#### For Windsurf:

Similar configuration in your IDE settings.

---

## Verify It Works

### Test 1: Check Extension

1. Open `chrome://extensions/`
2. Click "service worker" on Browser MCP card
3. Should see: `[Browser MCP] Registered 33 tools ✅`

### Test 2: Check Native Host

```bash
# Test the host directly
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | /usr/local/bin/browser-mcp-host
```

Should return initialization response.

### Test 3: Ask Your AI

In your IDE, ask:
```
"List all my browser tabs"
```

Your AI should return the list of tabs! ✅

---

## What You Can Do Now

### Ask your AI to:

- **"Show console errors from localhost:3000"**
  - Gets real-time console logs
  
- **"What's the DOM structure of the page?"**
  - Extracts full DOM tree
  
- **"Find elements with class 'button'"**
  - Queries the DOM
  
- **"What's in localStorage?"**
  - Reads browser storage
  
- **"What framework is this page using?"**
  - Detects React, Vue, Angular, etc.
  
- **"Get the computed CSS for .header"**
  - Shows all applied styles
  
- **"What's the component state?"**
  - Gets React/Vue component data

**All 33 tools are available!**

---

## Troubleshooting

### "Extension ID not found"

Go to `chrome://extensions/`, enable "Developer mode", find Browser MCP, copy the ID.

### "Permission denied"

The installer needs sudo to copy to `/usr/local/bin/`. Run with `./install-mac.sh`.

### "Native host not found"

```bash
# Check if installed
ls -la /usr/local/bin/browser-mcp-host

# Check Chrome config
ls -la ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/
```

### "Connection failed"

1. Reload extension in Chrome
2. Restart your IDE
3. Check service worker console for errors

---

## How It Works (Simple)

```
Your AI Question
      ↓
IDE sends request to Native Host
      ↓
Native Host forwards to Chrome Extension
      ↓
Extension uses CDP to inspect browser
      ↓
Results go back: Extension → Host → IDE
      ↓
AI shows you the answer!
```

---

## Files Created

```
/usr/local/bin/browser-mcp-host
  ↑ The native host script (Node.js)

~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.browsermcp.native.json
  ↑ Chrome configuration (tells Chrome where to find the host)
```

---

## Uninstall (if needed)

```bash
sudo rm /usr/local/bin/browser-mcp-host
rm ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.browsermcp.native.json
```

---

## Performance Features Included

✅ **Gzip compression** - For large messages
✅ **Streaming I/O** - Fast processing
✅ **Message batching** - Reduced overhead
✅ **Intelligent filtering** - 90% less noise
✅ **Delta compression** - Only send changes

---

## Summary

**3 Simple Steps:**

1. ✅ Get extension ID from `chrome://extensions/`
2. ✅ Run `./install-mac.sh` (paste ID when asked)
3. ✅ Configure your IDE with the MCP server

**Result:** Your AI can now debug websites automatically! 🚀

---

## Quick Install Command

```bash
# One-line install (you'll need to paste your extension ID)
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/native-messaging-host && ./install-mac.sh
```

**Then configure your IDE and you're done!** 🎉

