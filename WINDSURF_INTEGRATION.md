# Windsurf IDE Integration Guide

Complete guide to integrate Browser MCP with Windsurf IDE (Codeium's AI-powered editor).

---

## Quick Start (Automatic Setup)

### 1. Run the Automatic Setup Utility

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp
./setup-mcp.sh
```

This will:
- ✅ Detect Windsurf IDE on your system
- ✅ Create the config at `~/.codeium/windsurf/mcp_config.json`
- ✅ Backup any existing configuration
- ✅ Merge with existing MCP servers
- ✅ Test the MCP server works

### 2. Restart Windsurf

Quit Windsurf completely (Cmd+Q on macOS) and reopen it.

### 3. Test the Integration

Open Windsurf and ask Cascade:
```
"What MCP servers are available?"
```

You should see: **"browser-inspector"**

Then try:
```
"List browser resources"
"What browser tools can you use?"
```

---

## Manual Setup (Alternative)

If you prefer to configure manually:

### 1. Create Config Directory

```bash
# macOS/Linux
mkdir -p ~/.codeium/windsurf

# Windows (PowerShell)
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Codeium\windsurf"
```

### 2. Create MCP Configuration File

**macOS/Linux:** `~/.codeium/windsurf/mcp_config.json`
**Windows:** `%APPDATA%\Codeium\windsurf\mcp_config.json`

```json
{
  "mcpServers": {
    "browser-inspector": {
      "command": "node",
      "args": [
        "/absolute/path/to/browser-mcp/mcp-server/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

⚠️ **Important:** Replace `/absolute/path/to/browser-mcp` with your actual project path!

### 3. Verify Configuration

```bash
# macOS/Linux
cat ~/.codeium/windsurf/mcp_config.json

# Windows
type %APPDATA%\Codeium\windsurf\mcp_config.json
```

### 4. Restart Windsurf

Quit completely (Cmd+Q) and reopen.

---

## What You Can Do

Once configured, Windsurf's Cascade AI can:

### 1. Access Browser Resources

```
"Show me the browser resources available"
```

Expected response: Virtual filesystem with browser state:
- `browser://tab-{host}/dom/html` - Current DOM HTML
- `browser://tab-{host}/console/logs` - Console logs
- `browser://tab-{host}/network/requests` - Network requests
- `browser://tab-{host}/frameworks/detected` - Detected frameworks

### 2. Use Browser Tools

```
"What browser tools do you have access to?"
```

Tools available:
- `list-tabs` - Get all open browser tabs
- `get-tab-info` - Get detailed info about a specific tab

### 3. Run Prompts

```
"Generate a prompt to analyze a browser tab"
```

Prompts available:
- `analyze-tab` - Analyze a specific tab's state

---

## Verification Steps

### Step 1: Check MCP Server is Registered

Ask Cascade:
```
"What MCP servers are running?"
```

Expected: `browser-inspector` should be listed

### Step 2: Check Resources are Available

Ask Cascade:
```
"List all browser resources"
```

Expected: Should show virtual filesystem URIs (even if no tabs are open yet)

### Step 3: Check Tools Work

Ask Cascade:
```
"List all browser tabs"
```

Expected: Should return tab list (may be empty if Chrome extension not loaded)

---

## Load Chrome Extension

For the browser-inspector to actually capture browser state, you need to load the Chrome extension:

1. Open Chrome/Edge/Brave
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select: `/path/to/browser-mcp/extension-chromium/dist/`

The extension will:
- ✅ Detect frameworks (React, Vue, Angular, etc.)
- ✅ Capture console logs
- ✅ Monitor network requests
- ✅ Send DOM snapshots
- ✅ Communicate with MCP server via CDP

---

## Troubleshooting

### Issue: "No MCP servers found"

**Solution 1: Check config file exists**
```bash
ls -la ~/.codeium/windsurf/mcp_config.json
```

**Solution 2: Verify path is absolute**
The `args` must contain an absolute path, not relative:
```json
✅ CORRECT: "/Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server/dist/index.js"
❌ WRONG:   "./mcp-server/dist/index.js"
```

**Solution 3: Restart Windsurf completely**
- Cmd+Q to quit (not just close window)
- Reopen Windsurf

### Issue: "MCP server not responding"

**Solution 1: Test server manually**
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | \
  node /path/to/browser-mcp/mcp-server/dist/index.js
```

Expected: JSON response with server info

**Solution 2: Check Node.js version**
```bash
node --version  # Should be v18 or higher
```

**Solution 3: Rebuild project**
```bash
cd /path/to/browser-mcp
npm run build
```

### Issue: "Resources are empty"

This is expected if:
- Chrome extension not loaded yet
- No browser tabs open
- Browser not running

**Solution:** Load the Chrome extension (see instructions above)

### Issue: "Cannot find module"

**Check build exists:**
```bash
ls -la /path/to/browser-mcp/mcp-server/dist/index.js
```

If missing, rebuild:
```bash
npm run build
```

---

## Config File Locations

### macOS
```
~/.codeium/windsurf/mcp_config.json
```

### Linux
```
~/.codeium/windsurf/mcp_config.json
```

### Windows
```
%APPDATA%\Codeium\windsurf\mcp_config.json
```

---

## Example Workflow

Once everything is configured:

1. **Start Windsurf IDE**

2. **Load Chrome extension** (if not already loaded)

3. **Open a website in Chrome** (e.g., a React app at localhost:3000)

4. **Ask Cascade:**
   ```
   "What browser tabs are open?"
   "Show me the DOM for the localhost:3000 tab"
   "What frameworks were detected?"
   "Show me the console logs"
   ```

5. **Cascade can now:**
   - Read live browser state
   - Analyze DOM structure
   - Review console errors
   - Inspect network requests
   - Identify frameworks
   - Help debug issues

---

## Advanced: Multiple MCP Servers

If you already have other MCP servers, the Browser MCP will merge automatically:

```json
{
  "mcpServers": {
    "your-existing-server": {
      "command": "...",
      "args": ["..."]
    },
    "browser-inspector": {
      "command": "node",
      "args": [
        "/path/to/browser-mcp/mcp-server/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

The `setup-mcp.sh` script handles this automatically!

---

## Testing Commands

```bash
# Quick test (2 minutes)
./test-quick.sh

# Interactive demo (5 minutes)
./demo.sh

# Full test suite (138 tests)
npm test -- --run

# Manual server test
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | node mcp-server/dist/index.js
```

---

## Documentation

- **[README_SETUP.md](./README_SETUP.md)** - Quick setup guide
- **[START_HERE.md](./START_HERE.md)** - Getting started
- **[CURSOR_INTEGRATION.md](./CURSOR_INTEGRATION.md)** - Cursor IDE guide
- **[TESTING.md](./TESTING.md)** - Comprehensive testing
- **[README.md](./README.md)** - Full project overview

---

## Support

### Windsurf IDE
- **Website:** https://codeium.com/windsurf
- **Docs:** https://docs.codeium.com/windsurf
- **MCP Support:** https://docs.codeium.com/windsurf/mcp

### Browser MCP
- **Issues:** Check documentation above
- **Test:** Run `./test-quick.sh` to diagnose
- **Rebuild:** `npm run build` if needed

---

**Ready to use browser state in Windsurf IDE!** 🚀
