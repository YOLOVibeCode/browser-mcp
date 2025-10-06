# 🚀 Browser MCP Installation Walkthrough for Cursor IDE

A complete, step-by-step guide to install Browser MCP and give your Cursor IDE superpowers to access live browser state!

---

## 🎯 What You'll Get

After this installation, Cursor will be able to:
- **See live browser content** as virtual filesystem resources
- **Read console logs** and detect errors in real-time
- **Analyze network requests** and performance metrics
- **Detect JavaScript frameworks** (React, Vue, Angular, etc.)
- **Execute browser tools** like listing active tabs
- **Debug applications** with full browser context

---

## 📋 Prerequisites

**✅ Must have:**
- Cursor IDE installed ([cursor.sh](https://cursor.sh))
- Node.js 18+ installed (`node --version`)
- Git repository cloned (`git clone https://github.com/YOLOVibeCode/browser-mcp.git`)

**✅ Should have:**
- Chrome browser (for testing the extension)
- A web application running locally (like `localhost:3000`)

---

## 🛠️ Installation Steps

### Step 1: Verify Your Setup

First, let's make sure you're in the right place:

```bash
# Navigate to the browser-mcp directory
cd /Users/xcode/Documents/YOLOProjects/browser-mcp

# Check if package.json exists
ls -la package.json

# Verify Node.js version
node --version
```

**Expected output:**
- ✅ `package.json` file exists
- ✅ Node.js version 18.0.0 or higher

### Step 2: Install Dependencies

```bash
# Install all required packages
npm install

# This installs dependencies for:
# - Main project
# - MCP server
# - Chrome extension
# - Test harnesses
```

**Expected output:**
- ✅ All packages installed successfully
- ✅ No dependency conflicts

### Step 3: Run Tests (Optional but Recommended)

```bash
# Run all 138 tests to ensure everything works
npm test -- --run

# Alternative: Quick test run
npm run test-quick
```

**Expected output:**
- ✅ All tests passing (138/138)
- ✅ No test failures

### Step 4: Build All Components

```bash
# Build the entire project
npm run build

# This builds:
# - MCP server (mcp-server/dist/)
# - Chrome extension (extension-chromium/dist/)
# - All TypeScript contracts
```

**Expected output:**
- ✅ Build completed successfully
- ✅ All distribution files created

### Step 5: Install Chrome Extension

1. **Open Chrome** and navigate to `chrome://extensions/`
2. **Enable Developer mode** (toggle in top-right)
3. **Click "Load unpacked"**
4. **Select** the `extension-chromium/dist/` folder
5. **Verify** the extension appears in the list

**Expected result:**
- ✅ Browser Inspector extension appears in Chrome extensions

### Step 6: Configure Cursor IDE

#### Option A: Use the Setup Script (Recommended)

```bash
# Run the automated setup script
./setup-cursor.sh

# Follow the prompts and verify the output
```

#### Option B: Manual Configuration

```bash
# Create Cursor config directory
mkdir -p ~/.cursor

# Create MCP configuration file
cat > ~/.cursor/mcp.json << 'EOF'
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
EOF

# Verify the config file
cat ~/.cursor/mcp.json
```

**Important:** Make sure the path in the config matches your actual installation directory!

### Step 7: Restart Cursor IDE

1. **Quit Cursor completely** (Cmd+Q on Mac, Ctrl+Q on Linux)
2. **Wait a few seconds**
3. **Reopen Cursor**
4. **The MCP server should now be available**

---

## 🧪 Verification Tests

### Test 1: Check MCP Server Registration

1. **Open Cursor IDE**
2. **Open a new chat** (Cmd+L)
3. **Ask:** `"What MCP servers are available?"`

**Expected response:**
```
I can see the "browser-inspector" MCP server is available...
```

### Test 2: List Available Resources

**Ask:** `"List all available browser resources"`

**Expected response:**
```
browser://tab-localhost-3000/dom/html
browser://tab-localhost-3000/console/logs
browser://tab-localhost-3000/network/requests
browser://tab-localhost-3000/metadata/frameworks
```

### Test 3: List Available Tools

**Ask:** `"What browser tools can you use?"`

**Expected response:**
```
- listActiveTabs: List all active browser tabs
- getTabInfo: Get information about a specific tab
```

### Test 4: Execute a Tool

**Ask:** `"List all active browser tabs"`

Cursor should execute the tool and show you active tabs.

### Test 5: Read Browser Content

1. **Open a web page** in Chrome (e.g., `localhost:3000`)
2. **Click the Browser Inspector extension icon**
3. **Click "Activate Tab"**

**Then ask Cursor:** `"Show me the HTML content of the active tab"`

**Expected response:**
Cursor should read and display the HTML content of your active browser tab.

---

## 🎯 Usage Examples

### Example 1: Debug Console Errors

```
You: "Are there any console errors in the browser?"

Cursor: *reads browser://tab-*/console/logs*
        "Looking at the console logs, I can see a TypeError on line 42..."
```

### Example 2: Analyze Page Structure

```
You: "What's the page structure?"

Cursor: *reads browser://tab-*/dom/html*
        "The page has:
        - Header with navigation menu
        - Main content area with sidebar
        - Footer with copyright..."
```

### Example 3: Framework Detection

```
You: "What JavaScript frameworks are running?"

Cursor: *reads browser://tab-*/metadata/frameworks*
        "The browser tab is using:
        - React version 18.3.1
        - Redux for state management
        - Axios for HTTP requests..."
```

### Example 4: Network Analysis

```
You: "Check the network requests"

Cursor: *reads browser://tab-*/network/requests*
        "I can see:
        - 15 API calls made
        - Largest request: 2.3MB image file
        - Slowest request: 1.2s to /api/users..."
```

---

## 🐛 Troubleshooting

### Problem: "MCP server not found"

**Solutions:**
1. Check config file exists: `cat ~/.cursor/mcp.json`
2. Verify absolute path is correct
3. Test server manually: `node /path/to/mcp-server/dist/index.js`
4. Restart Cursor completely (Cmd+Q)

### Problem: "No resources available"

**Solutions:**
1. Activate a tab in Chrome first
2. Click extension icon → "Activate Tab"
3. Resources are created only after activation

### Problem: "Permission denied"

**Solution:**
```bash
chmod +x /Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server/dist/index.js
```

### Problem: "Node command not found"

**Solution:** Use absolute path in config:
```json
{
  "command": "/usr/local/bin/node",
  "args": ["/path/to/index.js"]
}
```

---

## 🎉 Success Indicators

**✅ All tests pass:**
- Installation completed
- All components built
- MCP server registered in Cursor

**✅ Extension loaded:**
- Browser Inspector appears in Chrome extensions
- Can activate tabs

**✅ Cursor integration:**
- Can see browser-inspector MCP server
- Can list resources and tools
- Can execute tools
- Can read browser content

---

## 🚀 Next Steps

1. **Test with a real application:**
   ```bash
   # Start a React/Vue/Angular app
   cd my-app
   npm run dev
   ```

2. **Activate the tab in Chrome:**
   - Navigate to `localhost:3000`
   - Click Browser Inspector extension
   - Click "Activate Tab"

3. **Use Cursor for debugging:**
   ```bash
   # Ask Cursor about your app
   "What's in the browser console?"
   "What frameworks are running?"
   "Show me the page HTML"
   ```

4. **Advanced debugging:**
   ```bash
   "Check for console errors"
   "Analyze network performance"
   "What components are rendered?"
   ```

---

## 📚 Additional Resources

- [Main README](./README.md) - Complete project documentation
- [Requirements](./REQUIREMENTS.md) - Detailed technical specifications
- [Testing Guide](./TESTING.md) - How to run and write tests
- [Cursor Integration](./CURSOR_INTEGRATION.md) - Detailed Cursor setup guide

---

## 💡 Pro Tips

1. **Use natural language** - don't worry about exact resource URIs
2. **Combine code + browser context** for powerful debugging
3. **Iterative workflow** - check → fix → verify with Cursor
4. **Multiple tabs** - activate different tabs for multi-page debugging

---

**🎊 Congratulations! Your Cursor IDE now has superpowers to access live browser state!**

**Ready to debug like never before?** 🚀
