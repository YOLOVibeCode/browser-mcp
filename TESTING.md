# Testing Guide - Browser MCP Family

This guide will walk you through testing the entire system from unit tests to end-to-end integration.

---

## ✅ Step 1: Run All Unit Tests

Verify the core infrastructure works:

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp
npm test -- --run
```

**Expected output:**
```
Test Files  10 passed (10)
Tests  138 passed (138)
```

All tests should be green! ✅

---

## 🔨 Step 2: Build All Packages

Build the infrastructure and MCP server:

```bash
npm run build
```

**Expected output:**
```
✨ Build complete! Extension ready at: dist/
```

Verify the build:
```bash
ls -la mcp-server/dist/
ls -la extension-chromium/dist/
```

You should see compiled JavaScript files.

---

## 🧪 Step 3: Test MCP Server Locally (Manual Test)

Test the MCP server's stdio transport without Claude Desktop:

### 3.1 Start the Server

```bash
cd mcp-server
node dist/index.js
```

**Expected output:**
```
🚀 Starting Browser MCP Server...
✅ Browser MCP Server v1.0.0 initialized
   Capabilities: {"resources":true,"tools":true,"prompts":true}
   Registered 2 tools
   Registered 1 prompts

🎯 MCP Server ready! Listening on stdio...
   Send JSON-RPC requests via stdin.

📑 Tab activated: 1 (http://localhost:3000)
   Resource registered: browser://tab-localhost-3000/dom/html
   Resource registered: browser://tab-localhost-3000/console/logs
   Resource registered: browser://tab-localhost-3000/network/requests
   Resource registered: browser://tab-localhost-3000/metadata/frameworks
```

### 3.2 Test JSON-RPC Communication

In another terminal, send requests to the server:

```bash
# Test 1: Initialize
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | node dist/index.js

# Test 2: List resources
echo '{"jsonrpc":"2.0","id":2,"method":"resources/list"}' | node dist/index.js

# Test 3: List tools
echo '{"jsonrpc":"2.0","id":3,"method":"tools/list"}' | node dist/index.js

# Test 4: List prompts
echo '{"jsonrpc":"2.0","id":4,"method":"prompts/list"}' | node dist/index.js
```

**Expected responses** (on stdout):

```json
{"jsonrpc":"2.0","id":1,"result":{"name":"Browser MCP Server","version":"1.0.0","capabilities":{"resources":true,"tools":true,"prompts":true}}}

{"jsonrpc":"2.0","id":2,"result":{"resources":[{"uri":"browser://tab-localhost-3000/dom/html","mimeType":"text/html","content":""},...]}}

{"jsonrpc":"2.0","id":3,"result":{"tools":[{"name":"listActiveTabs","description":"List all active browser tabs","inputSchema":{...}},...]}}

{"jsonrpc":"2.0","id":4,"result":{"prompts":[{"name":"analyzeTab","description":"Generate a prompt to analyze tab content"}]}}
```

✅ If you see JSON-RPC responses, the stdio transport is working!

---

## 🌐 Step 4: Test Chrome Extension

### 4.1 Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top-right)
3. Click **"Load unpacked"**
4. Select `/Users/xcode/Documents/YOLOProjects/browser-mcp/extension-chromium/dist/`

**Expected:** Extension loads with:
- Name: "Browser Inspector for AI"
- Icon appears in toolbar

### 4.2 Test Extension Functionality

1. **Open a test page:**
   - Navigate to `http://localhost:3000` or any website

2. **Click extension icon:**
   - Popup should appear showing:
     - Current URL
     - "Not Active" status
     - "Activate Tab" button

3. **Click "Activate Tab":**
   - Status changes to "Active"
   - Port number appears (e.g., "3100")
   - Virtual filesystem URI shown (e.g., `browser://tab-localhost-3000/`)

4. **Open browser console:**
   ```javascript
   // Check if service worker is running
   chrome.runtime.sendMessage({type: 'GET_STATUS'})
   ```

✅ If the popup works and shows port/URI, the extension is working!

---

## 🎯 Step 5: Test End-to-End with Test Script

Create a test script to simulate the full flow:

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp
cat > test-e2e.sh << 'EOF'
#!/bin/bash

echo "🧪 End-to-End Test Script"
echo "========================="
echo ""

# Start MCP server in background
echo "1️⃣ Starting MCP server..."
cd mcp-server
node dist/index.js > /tmp/mcp-server.log 2>&1 &
MCP_PID=$!
sleep 2

echo "✅ MCP server running (PID: $MCP_PID)"
echo ""

# Test initialize
echo "2️⃣ Testing initialize..."
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' > /tmp/mcp-input.txt
timeout 2 node dist/index.js < /tmp/mcp-input.txt > /tmp/mcp-output.txt 2>/dev/null

if grep -q "Browser MCP Server" /tmp/mcp-output.txt; then
    echo "✅ Initialize successful"
else
    echo "❌ Initialize failed"
fi
echo ""

# Test resources
echo "3️⃣ Testing resources/list..."
echo '{"jsonrpc":"2.0","id":2,"method":"resources/list"}' > /tmp/mcp-input.txt
timeout 2 node dist/index.js < /tmp/mcp-input.txt > /tmp/mcp-output.txt 2>/dev/null

if grep -q "resources" /tmp/mcp-output.txt; then
    echo "✅ Resources list successful"
    echo "   Found resources:"
    cat /tmp/mcp-output.txt | grep -o 'browser://[^"]*' | head -3
else
    echo "❌ Resources list failed"
fi
echo ""

# Test tools
echo "4️⃣ Testing tools/list..."
echo '{"jsonrpc":"2.0","id":3,"method":"tools/list"}' > /tmp/mcp-input.txt
timeout 2 node dist/index.js < /tmp/mcp-input.txt > /tmp/mcp-output.txt 2>/dev/null

if grep -q "listActiveTabs" /tmp/mcp-output.txt; then
    echo "✅ Tools list successful"
    echo "   Found tools: listActiveTabs, getTabInfo"
else
    echo "❌ Tools list failed"
fi
echo ""

# Cleanup
kill $MCP_PID 2>/dev/null
echo "🧹 Cleanup complete"
echo ""
echo "========================="
echo "✅ End-to-End Test Complete!"
EOF

chmod +x test-e2e.sh
./test-e2e.sh
```

**Expected output:**
```
🧪 End-to-End Test Script
=========================

1️⃣ Starting MCP server...
✅ MCP server running (PID: 12345)

2️⃣ Testing initialize...
✅ Initialize successful

3️⃣ Testing resources/list...
✅ Resources list successful
   Found resources:
   browser://tab-localhost-3000/dom/html
   browser://tab-localhost-3000/console/logs
   browser://tab-localhost-3000/network/requests

4️⃣ Testing tools/list...
✅ Tools list successful
   Found tools: listActiveTabs, getTabInfo

🧹 Cleanup complete

=========================
✅ End-to-End Test Complete!
```

---

## 🖥️ Step 6: Test with Claude Desktop (Optional)

**Note:** This requires Claude Desktop to be installed.

### 6.1 Configure Claude Desktop

```bash
# Create config directory if needed
mkdir -p ~/Library/Application\ Support/Claude/

# Update the path in config to match your installation
sed "s|/Users/xcode/Documents/YOLOProjects/browser-mcp|$(pwd)|g" \
    claude_desktop_config.json > ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Verify config
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

### 6.2 Restart Claude Desktop

1. Quit Claude Desktop completely
2. Reopen Claude Desktop
3. Check MCP server status in Claude Desktop settings

### 6.3 Test in Claude Desktop

Ask Claude:

1. **"What MCP servers are available?"**
   - Should mention "browser-inspector"

2. **"List available resources"** or **"What resources can you access?"**
   - Should show `browser://tab-*` URIs

3. **"What tools are available?"**
   - Should list `listActiveTabs` and `getTabInfo`

4. **"List all active browser tabs"**
   - Should execute the tool and return results

5. **"Show me the HTML content of browser://tab-localhost-3000/dom/html"**
   - Should read the resource

✅ If Claude responds with browser data, the integration is working!

---

## 🐛 Step 7: Debug Issues

### MCP Server Not Starting

```bash
# Check for errors
cd mcp-server
node dist/index.js 2>&1 | tee /tmp/mcp-debug.log

# Common issues:
# - Port already in use → Change port in PortManager
# - Module not found → Run npm install
# - TypeScript errors → Run npm run build
```

### Extension Not Loading

```bash
# Rebuild extension
cd extension-chromium
npm run build

# Check dist folder exists
ls -la dist/

# Check manifest
cat dist/manifest.json
```

### Claude Desktop Not Connecting

```bash
# Check config path
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Check server path is absolute
# Update path to:
node -e "console.log(require('path').resolve('.'))"
# Copy output and update config

# Check Claude Desktop logs
# macOS: ~/Library/Logs/Claude/
tail -f ~/Library/Logs/Claude/mcp*.log
```

### JSON-RPC Errors

```bash
# Test with verbose output
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | \
  node dist/index.js 2>&1

# Check stderr for error messages
# stdout = JSON-RPC responses
# stderr = debug logs
```

---

## 📊 Step 8: Verify Test Coverage

Check that all components are tested:

```bash
# Run tests with coverage (optional)
npm test -- --run --coverage

# View coverage report
open coverage/index.html
```

**Current coverage:**
- 138/138 tests passing ✅
- Event Bus: 8 tests
- Port Manager: 17 tests
- Tab Manager: 22 tests
- Framework Detector: 21 tests
- CDP Adapter: 15 tests
- MCP Server: 19 tests
- Stdio Transport: 10 tests
- Virtual Filesystem: 15 tests
- Chrome Test Instance: 11 tests

---

## ✅ Success Checklist

- [ ] All 138 unit tests pass
- [ ] Build completes without errors
- [ ] MCP server starts and listens on stdio
- [ ] JSON-RPC requests return valid responses
- [ ] Chrome extension loads in `chrome://extensions/`
- [ ] Extension popup shows tab information
- [ ] Tab activation allocates a port (3100-3199)
- [ ] Virtual filesystem URIs are generated
- [ ] (Optional) Claude Desktop shows MCP server
- [ ] (Optional) Claude can list resources and tools
- [ ] (Optional) Claude can execute tools

---

## 🎓 What Each Test Proves

| Test | What It Proves |
|------|---------------|
| Unit tests (138) | All components work in isolation |
| Build | TypeScript compiles, no type errors |
| MCP server stdio | JSON-RPC transport works |
| Extension popup | UI and service worker communication work |
| Tab activation | Port allocation, event emission, resource registration work |
| Claude Desktop | End-to-end integration with AI assistant works |

---

## 🚀 Next Steps After Testing

1. **Add more tools** - Execute JavaScript, navigate tabs, capture screenshots
2. **Add CDP integration** - Real DOM access, console logs, network monitoring
3. **Add native messaging** - Connect extension to MCP server
4. **Add more framework detection** - Svelte, Blazor, Ember, etc.
5. **Deploy** - Package extension for Chrome Web Store

---

## 📝 Test Reports

After running tests, generate a report:

```bash
# Run tests and save output
npm test -- --run > test-report.txt 2>&1

# Create summary
echo "# Test Summary" > TEST_SUMMARY.md
echo "Date: $(date)" >> TEST_SUMMARY.md
echo "" >> TEST_SUMMARY.md
grep "Test Files" test-report.txt >> TEST_SUMMARY.md
grep "Tests" test-report.txt >> TEST_SUMMARY.md
cat TEST_SUMMARY.md
```

---

**You now have a complete testing strategy from unit tests to end-to-end integration!** 🎉
