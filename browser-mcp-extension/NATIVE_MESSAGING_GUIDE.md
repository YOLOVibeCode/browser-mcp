# 🔌 Native Messaging Host - Complete Guide

## What is Native Messaging?

**Native Messaging** is the bridge that connects your Chrome extension to your IDE (like Claude Desktop, Cursor, Windsurf, etc.).

### How it Works:

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Your IDE      │ ◄─────► │  Native Host     │ ◄─────► │ Chrome Extension│
│ (Claude/Cursor) │  stdio  │ (Node.js script) │  stdio  │  (Browser MCP)  │
└─────────────────┘         └──────────────────┘         └─────────────────┘
                                                                    ▼
                                                          ┌─────────────────┐
                                                          │ Browser Tabs    │
                                                          │ (Your Web Apps) │
                                                          └─────────────────┘
```

**In Simple Terms:**
- Your IDE wants to debug a website
- It talks to the Native Host (a small Node.js script)
- Native Host forwards the request to the Chrome extension
- Extension uses Chrome DevTools Protocol (CDP) to inspect your tabs
- Results flow back: Extension → Native Host → IDE

---

## Why Do You Need It?

### Without Native Messaging:
- ❌ Extension runs in Chrome (isolated)
- ❌ IDE runs separately (can't communicate)
- ❌ Manual copying/pasting of data

### With Native Messaging:
- ✅ IDE can send commands to Chrome
- ✅ Get console logs, DOM, network requests automatically
- ✅ Full debugging from your IDE/LLM
- ✅ All 33 tools available to your AI assistant

---

## Installation Steps

### Step 1: Install the Native Host

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/native-messaging-host
./install-mac.sh
```

**What this does:**
- Copies the native host script to a system location
- Registers it with Chrome so the extension can find it
- Creates the necessary configuration files

### Step 2: Verify Installation

```bash
# Check if the manifest was created
ls -la ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/

# Should show: com.browser_mcp.host.json
```

---

## Configuration for Your IDE

### Option 1: Claude Desktop

Create or edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "node",
      "args": [
        "/path/to/native-messaging-host/host.js"
      ],
      "env": {}
    }
  }
}
```

### Option 2: Cursor

Create or edit: `.cursor/mcp.json` in your project

```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "node",
      "args": [
        "/Users/xcode/Documents/YOLOProjects/browser-mcp/native-messaging-host/host.js"
      ]
    }
  }
}
```

### Option 3: Windsurf

Similar to Cursor, create configuration in your project settings.

---

## What Can You Do With It?

Once set up, you can ask your AI assistant to:

### Browser Inspection:
- **"Show me the console errors on localhost:3000"**
  - Gets real-time console logs
  
- **"What's in localStorage?"**
  - Reads all storage data
  
- **"Find the element with class 'button'"**
  - Queries the DOM

### CSS Debugging:
- **"What styles apply to the header?"**
  - Gets computed CSS styles
  
- **"Find the CSS rule for text color"**
  - Searches CSS rules

### Framework Analysis:
- **"What framework is this page using?"**
  - Detects React, Vue, Angular, etc.
  
- **"Show me the component tree"**
  - Maps out component hierarchy

### Advanced Debugging:
- **"What's the state of this component?"**
  - Gets React/Vue component state
  
- **"Trace where this data comes from"**
  - Follows data flow

---

## Testing the Connection

### Test 1: Check if Extension is Ready

1. Load the extension in Chrome (`chrome://extensions/`)
2. Click "service worker"
3. Should see: `[Browser MCP] Registered 33 tools ✅`

### Test 2: Test Native Messaging (Optional)

Create a test file: `test-native-messaging.js`

```javascript
const { spawn } = require('child_process');

const host = spawn('node', [
  '/Users/xcode/Documents/YOLOProjects/browser-mcp/native-messaging-host/host.js'
]);

// Send a test request
const request = JSON.stringify({
  jsonrpc: '2.0',
  id: 1,
  method: 'tools/list'
}) + '\n';

host.stdin.write(request);

host.stdout.on('data', (data) => {
  console.log('Response:', data.toString());
});
```

Run: `node test-native-messaging.js`

---

## Troubleshooting

### "Native host has exited"

**Solution:**
```bash
# Reinstall the native host
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/native-messaging-host
./install-mac.sh

# Reload extension in Chrome
```

### "Cannot find native host"

**Solution:**
```bash
# Check manifest exists
cat ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.browser_mcp.host.json

# Should show path to host.js
```

### "Extension not connecting"

**Solution:**
1. Reload extension in `chrome://extensions/`
2. Check service worker console for errors
3. Verify native host is registered
4. Restart IDE

---

## What Happens Under the Hood

### When IDE Sends a Command:

1. **IDE** → Sends JSON-RPC request via stdio
   ```json
   {"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"listTabs"}}
   ```

2. **Native Host** → Forwards to Chrome extension via Native Messaging

3. **Extension** → Executes tool (e.g., lists all tabs)

4. **Extension** → Returns result to Native Host

5. **Native Host** → Forwards to IDE via stdio

6. **IDE** → Shows you the results!

---

## Performance Features

The native messaging host includes optimizations:

### Message Filtering (90% reduction)
- Automatically filters webpack/HMR noise
- Only sends relevant data to IDE

### Delta Compression (95% savings)
- On repeat queries, only sends changes
- Drastically reduces bandwidth

### Binary Protocol (Optional)
- Can use binary encoding for large payloads
- Even faster for DOM/network data

---

## Files Involved

```
native-messaging-host/
├── host.js                    ← Main script (Node.js)
├── install-mac.sh            ← Installation script
├── manifest-mac.json         ← Chrome configuration
└── README.md                 ← Documentation

browser-mcp-extension/
└── background/
    ├── service-worker.js     ← Receives messages from host
    └── adapters/
        └── native-messaging.js  ← Handles stdio communication
```

---

## Quick Start Checklist

- [ ] Chrome extension loaded
- [ ] Extension shows 33 tools registered
- [ ] Native host installed (`./install-mac.sh`)
- [ ] IDE configured with MCP server
- [ ] Test: Ask IDE "List all browser tabs"
- [ ] ✅ Working!

---

## Example Usage in IDE

Once configured, you can use natural language:

### Console Debugging:
```
You: "Show me console errors from localhost:3000"
AI: *Uses getConsole tool*
    "Here are the console errors:
     - TypeError at line 45
     - Failed to fetch /api/users"
```

### DOM Inspection:
```
You: "Find the login button"
AI: *Uses querySelector tool*
    "Found <button class='login-btn'>Login</button>
     Located at div.header > nav > button"
```

### Storage Inspection:
```
You: "What's in localStorage?"
AI: *Uses getLocalStorage tool*
    "localStorage contains:
     - authToken: 'abc123...'
     - userName: 'john@example.com'
     - lastVisit: '2024-10-08'"
```

---

## Benefits

### For You:
- ✅ **No more manual copying** - AI gets data automatically
- ✅ **Faster debugging** - All tools available instantly
- ✅ **Better context** - AI sees everything you see
- ✅ **90% less noise** - Intelligent filtering

### For Your AI:
- ✅ **33 powerful tools** - Complete debugging suite
- ✅ **Real-time data** - Live browser state
- ✅ **Framework-aware** - Understands React, Vue, etc.
- ✅ **Source mapping** - Can read original code

---

## Summary

**The Native Messaging Host is the communication bridge that makes your Browser MCP extension useful from your IDE.**

Without it: Extension works in Chrome only
With it: **Full debugging superpowers in your AI IDE!** 🚀

---

**Ready to install?**

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp/native-messaging-host
./install-mac.sh
```

Then configure your IDE and start debugging! 🎉

