# MCP Test Panel Guide

Quick reference for testing your Browser MCP installation using the built-in test panel.

---

## 🧪 Accessing the Test Panel

1. **Open Chrome** and click the Browser Inspector extension icon
2. In the popup, click **"🧪 Test MCP Server"** link
3. The test panel opens in a new view

---

## 🎯 What the Test Panel Does

The test panel verifies your MCP server connection and all available tools by simulating real MCP JSON-RPC requests. It provides:

- **Visual feedback** - See pass/fail status for each test
- **Real response data** - View actual JSON-RPC responses
- **Quick diagnostics** - Identify connection issues immediately
- **No IDE required** - Test the MCP server independently

---

## 📋 Available Tests

### 1. Server Initialization
**Tests:** MCP server responds to initialization request
**Expected Result:** Server name, version, and capabilities

### 2. List Available Tools
**Tests:** Retrieves all MCP tools
**Expected Result:** 6 tools listed with descriptions
- `listActiveTabs`
- `getTabInfo`
- `pinTab`
- `unpinTab`
- `getPinnedTab`
- `listSessionBindings`

### 3. List Active Tabs
**Tests:** Calls the `listActiveTabs` tool
**Expected Result:** Array of currently connected browser tabs

### 4. List Available Resources
**Tests:** Retrieves virtual filesystem resources
**Expected Result:** 4 resources per connected tab:
- `browser://tab-{url}/dom/html`
- `browser://tab-{url}/console/logs`
- `browser://tab-{url}/network/requests`
- `browser://tab-{url}/metadata/frameworks`

### 5. Session Bindings
**Tests:** Lists all session-to-tab bindings
**Expected Result:** Current IDE session bindings

### 6. List Prompts
**Tests:** Retrieves available MCP prompts
**Expected Result:** 1 prompt (`analyzeTab`)

---

## 🚀 Running Tests

### Run All Tests
Click **"▶ Run All Tests"** to execute all 6 tests sequentially.

### Run Individual Tests
Click **"▶ Run Test"** on any specific test to run it independently.

---

## ✅ Interpreting Results

### Test Status Indicators

| Status | Icon | Meaning |
|--------|------|---------|
| **Pending** | ⏸ | Test hasn't run yet |
| **Running** | ⏳ | Test is currently executing |
| **Passed** | ✓ | Test completed successfully |
| **Failed** | ✗ | Test encountered an error |

### Summary Counters
- **Passed** - Number of successful tests
- **Failed** - Number of failed tests
- **Total** - Total test count (6)

### Response Data
Each test expands to show the actual JSON response from the MCP server. This helps you:
- Verify correct tool schemas
- Check resource URIs
- Debug connection issues

---

## 🐛 Troubleshooting

### All Tests Failing
**Error:** "Cannot reach MCP server at http://localhost:3100"
**Solution:**
1. Make sure companion app is running: `cd companion-app && node index.js`
2. Verify port 3100 is accessible: `curl http://localhost:3100/health`
3. Check companion app terminal for errors

### Some Tests Pass, Others Fail
**Likely Issue:** MCP server partially working but missing components
**Solution:**
1. Check MCP server logs for specific errors
2. Rebuild infrastructure: `npm run build` in each package
3. Restart the MCP server

### Test Shows Wrong Data
**Example:** Test 2 shows 3 tools instead of 6
**Solution:**
1. Rebuild MCP server: `cd mcp-server && npm run build`
2. Verify [mcp-server/src/index.ts](mcp-server/src/index.ts:354-359) registers all 6 tools
3. Restart Claude/Cursor if using integrated MCP

### Test Panel Won't Load
**Error:** Blank page or 404
**Solution:**
1. Rebuild extension: `cd extension-chromium && npm run build`
2. Verify files exist:
   ```bash
   ls extension-chromium/dist/popup/mcp-test.html
   ls extension-chromium/dist/popup/mcp-test.js
   ```
3. Reload extension in Chrome (`chrome://extensions/` → Reload button)

---

## 🔍 Understanding MCP Responses

### Example: Successful Tool Call

```json
{
  "success": true,
  "result": [
    {
      "tabId": 1,
      "url": "http://localhost:3000",
      "port": 3100,
      "isActive": true
    }
  ]
}
```

### Example: Failed Tool Call

```json
{
  "success": false,
  "error": "Tab 999 not found"
}
```

---

## 💡 Best Practices

1. **Test Before Using in IDE** - Run all tests to verify setup before configuring Claude/Cursor
2. **Keep Companion App Running** - Tests require the health check server at port 3100
3. **Connect a Tab First** - Some tests return more meaningful data when tabs are connected
4. **Check Logs** - Keep service worker DevTools open to see detailed logs during testing
5. **Rebuild After Changes** - Always rebuild extension after modifying test code

---

## 🎓 Using Test Results

### For Debugging
- Share test results when reporting issues
- Compare expected vs actual responses
- Identify which component is failing

### For Development
- Verify changes to MCP tools
- Test new tool implementations
- Validate resource providers

### For Documentation
- Confirm tool schemas match docs
- Verify expected behavior
- Generate example responses

---

## 🔗 Related Files

- Test Panel HTML: [extension-chromium/popup/mcp-test.html](extension-chromium/popup/mcp-test.html)
- Test Panel JavaScript: [extension-chromium/popup/mcp-test.js](extension-chromium/popup/mcp-test.js)
- MCP Server Implementation: [mcp-server/src/index.ts](mcp-server/src/index.ts)
- Tool Definitions: [mcp-server/src/index.ts:191-362](mcp-server/src/index.ts)

---

## 📚 Next Steps

After all tests pass:

1. ✅ Configure Claude Desktop ([INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md#part-6-configure-claude-desktop))
2. ✅ Configure Cursor IDE ([INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md#part-7-configure-cursor-ide))
3. ✅ Connect browser tabs and start using MCP tools in your IDE

---

Need help? Check the [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for complete setup instructions.
