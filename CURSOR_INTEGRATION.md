# 🎯 Cursor IDE Integration Guide

Integrate Browser MCP with Cursor IDE to give AI access to browser state!

---

## 📋 Prerequisites

1. ✅ Cursor IDE installed ([cursor.sh](https://cursor.sh))
2. ✅ Browser MCP built (`npm run build`)
3. ✅ All tests passing (`npm test -- --run`)

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Locate Cursor MCP Config

Cursor uses the same MCP configuration as Claude Desktop.

**macOS/Linux:**
```bash
~/.cursor/mcp.json
```

**Windows:**
```bash
%APPDATA%\Cursor\mcp.json
```

### Step 2: Create MCP Configuration

Create or edit the config file:

```bash
# macOS/Linux
mkdir -p ~/.cursor
nano ~/.cursor/mcp.json
```

Add the following configuration:

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

**Important:** Update the path to match your actual installation directory!

### Step 3: Get Absolute Path

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp
pwd
# Copy this output and use it in the config above
```

### Step 4: Verify Configuration

```bash
# Check the config file exists and is valid
cat ~/.cursor/mcp.json

# Verify the path is correct
node /Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server/dist/index.js --help 2>&1 | head -5
```

### Step 5: Restart Cursor

1. Quit Cursor completely (Cmd+Q on Mac)
2. Reopen Cursor
3. The MCP server should be available

---

## 🧪 Testing the Integration

### Test 1: Verify MCP Server in Cursor

1. Open Cursor
2. Open a new chat (Cmd+L)
3. Type: **"What MCP servers are available?"**

Expected response:
```
I can see the "browser-inspector" MCP server is available...
```

### Test 2: List Resources

Ask Cursor:
```
"List all available browser resources"
```

Expected response should include:
```
browser://tab-localhost-3000/dom/html
browser://tab-localhost-3000/console/logs
browser://tab-localhost-3000/network/requests
browser://tab-localhost-3000/metadata/frameworks
```

### Test 3: List Tools

Ask Cursor:
```
"What browser tools can you use?"
```

Expected response:
```
- listActiveTabs: List all active browser tabs
- getTabInfo: Get information about a specific tab
```

### Test 4: Execute a Tool

Ask Cursor:
```
"List all active browser tabs"
```

Cursor should execute the `listActiveTabs` tool and show results.

### Test 5: Read a Resource

Ask Cursor:
```
"Show me the HTML content from browser://tab-localhost-3000/dom/html"
```

Cursor should read the resource and display the content.

---

## 🎯 Usage Examples

### Example 1: Analyze Tab Content

```
You: "What's in the active browser tab?"

Cursor: *executes listActiveTabs tool*
        "I can see tab 1 is active at http://localhost:3000..."
```

### Example 2: Check Console Logs

```
You: "Are there any console errors in the browser?"

Cursor: *reads browser://tab-*/console/logs*
        "Looking at the console logs, I can see..."
```

### Example 3: Detect Frameworks

```
You: "What JavaScript frameworks are running in the browser?"

Cursor: *reads browser://tab-*/metadata/frameworks*
        "The browser tab is using React version 18.3.1..."
```

### Example 4: Inspect DOM

```
You: "What's the page structure?"

Cursor: *reads browser://tab-*/dom/html*
        "The page has the following structure:
        - Header with navigation
        - Main content area
        - Footer..."
```

---

## 🔧 Advanced Configuration

### Multiple MCP Servers

You can run multiple MCP servers:

```json
{
  "mcpServers": {
    "browser-inspector": {
      "command": "node",
      "args": [
        "/path/to/browser-mcp/mcp-server/dist/index.js"
      ]
    },
    "other-server": {
      "command": "node",
      "args": ["/path/to/other-server.js"]
    }
  }
}
```

### Environment Variables

Add custom environment variables:

```json
{
  "mcpServers": {
    "browser-inspector": {
      "command": "node",
      "args": [
        "/path/to/browser-mcp/mcp-server/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production",
        "DEBUG": "mcp:*",
        "PORT_RANGE_START": "3100",
        "PORT_RANGE_END": "3199"
      }
    }
  }
}
```

### Custom Node Path

If you use nvm or multiple Node versions:

```json
{
  "mcpServers": {
    "browser-inspector": {
      "command": "/Users/xcode/.nvm/versions/node/v20.10.0/bin/node",
      "args": [
        "/path/to/browser-mcp/mcp-server/dist/index.js"
      ]
    }
  }
}
```

---

## 🐛 Troubleshooting

### Issue 1: "MCP server not found"

**Symptoms:** Cursor doesn't show browser-inspector server

**Solutions:**

1. Check config file location:
```bash
# Verify file exists
cat ~/.cursor/mcp.json

# Check for syntax errors
python3 -m json.tool ~/.cursor/mcp.json
```

2. Verify absolute path:
```bash
# Test the server directly
node /Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server/dist/index.js
# Should start without errors
```

3. Check Cursor logs:
```bash
# macOS
tail -f ~/Library/Logs/Cursor/main.log

# Look for MCP-related errors
```

4. Restart Cursor completely (Cmd+Q, not just close window)

### Issue 2: "Command not found: node"

**Symptoms:** MCP server fails to start

**Solutions:**

1. Use absolute path to node:
```bash
# Find node path
which node
# Use this path in config
```

2. Or use npx:
```json
{
  "command": "npx",
  "args": ["node", "/path/to/index.js"]
}
```

### Issue 3: "No resources available"

**Symptoms:** Server starts but no browser resources

**Solutions:**

1. Activate a tab in Chrome:
   - Load the extension
   - Click "Activate Tab"
   - Resources are created on activation

2. Check server logs:
```bash
# Run server manually to see logs
cd mcp-server
node dist/index.js
# Should show "Tab activated" messages
```

### Issue 4: "JSON-RPC errors"

**Symptoms:** Cursor shows communication errors

**Solutions:**

1. Test JSON-RPC manually:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | node dist/index.js
# Should return valid JSON
```

2. Check stderr vs stdout:
```bash
node dist/index.js 2>&1 | head -20
# stdout = JSON-RPC responses
# stderr = debug logs
```

3. Rebuild the server:
```bash
npm run build
```

### Issue 5: "Permission denied"

**Symptoms:** Cannot execute the server

**Solutions:**

```bash
# Check file permissions
ls -la mcp-server/dist/index.js

# Make executable if needed
chmod +x mcp-server/dist/index.js
```

---

## 🎓 How It Works

### Architecture

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Cursor    │ ◄─────► │  MCP Server  │ ◄─────► │   Chrome    │
│     IDE     │  stdio  │  (Node.js)   │  events │  Extension  │
└─────────────┘         └──────────────┘         └─────────────┘
                              │
                              ▼
                        ┌──────────────┐
                        │   Virtual    │
                        │  Filesystem  │
                        │  (Resources) │
                        └──────────────┘
```

### Communication Flow

1. **User asks Cursor** a question about browser state
2. **Cursor sends JSON-RPC request** via stdin to MCP server
3. **MCP server** looks up resources/tools
4. **Virtual filesystem** provides current browser state
5. **MCP server sends JSON-RPC response** via stdout
6. **Cursor displays** the result to user

### What Cursor Can Access

- **Resources** (virtual filesystem):
  - DOM HTML content
  - Console logs
  - Network requests
  - Detected frameworks

- **Tools** (executable actions):
  - List active tabs
  - Get tab information

- **Prompts** (AI assistance):
  - Analyze tab content
  - Debug JavaScript
  - Inspect page structure

---

## 📝 Example Workflow

### 1. Activate Browser Tab

In Chrome:
1. Navigate to `http://localhost:3000`
2. Click extension icon
3. Click "Activate Tab"

MCP Server logs:
```
📑 Tab activated: 1 (http://localhost:3000)
   Resource registered: browser://tab-localhost-3000/dom/html
   Resource registered: browser://tab-localhost-3000/console/logs
   Resource registered: browser://tab-localhost-3000/network/requests
   Resource registered: browser://tab-localhost-3000/metadata/frameworks
```

### 2. Ask Cursor About the Tab

In Cursor chat:
```
You: "What's on the localhost:3000 page?"
```

Cursor workflow:
1. Sends `resources/list` to MCP server
2. Finds `browser://tab-localhost-3000/dom/html`
3. Sends `resources/read` with that URI
4. Gets HTML content
5. Analyzes and responds

### 3. Debugging with Cursor

```
You: "Are there any console errors?"

Cursor:
- Reads browser://tab-localhost-3000/console/logs
- Filters for error level
- Shows you the errors with context
```

### 4. Framework Detection

```
You: "What framework is this app using?"

Cursor:
- Reads browser://tab-localhost-3000/metadata/frameworks
- Shows detected frameworks with versions
- Provides relevant documentation links
```

---

## 🎨 Cursor Composer Integration

Use Browser MCP with Cursor Composer for powerful workflows:

### Example: Debug React App

```
You: "Help me debug this React component. Check the browser console for errors."

Cursor Composer:
1. Reads your component code
2. Reads browser://tab-*/console/logs
3. Reads browser://tab-*/metadata/frameworks
4. Identifies the issue
5. Suggests fixes with code changes
```

### Example: Optimize Performance

```
You: "Check the network requests and suggest optimizations"

Cursor Composer:
1. Reads browser://tab-*/network/requests
2. Analyzes request sizes and timing
3. Reads your code
4. Suggests specific optimizations
5. Can apply changes automatically
```

---

## 📊 Verification Checklist

Use this to verify your integration works:

- [ ] Config file exists at `~/.cursor/mcp.json`
- [ ] Absolute path is correct in config
- [ ] MCP server runs manually without errors
- [ ] Cursor shows "browser-inspector" in MCP servers
- [ ] Cursor can list resources
- [ ] Cursor can list tools
- [ ] Cursor can execute tools
- [ ] Cursor can read resources
- [ ] Chrome extension is loaded
- [ ] Tab activation creates resources
- [ ] Cursor can access tab data

---

## 🚀 Next Steps

### For Development

1. **Use Cursor for debugging:**
   - "Check console errors"
   - "What network requests are slow?"
   - "Show me the page structure"

2. **Use Cursor Composer:**
   - "Fix the errors you see in the browser"
   - "Optimize the components causing network issues"
   - "Add error handling for the console warnings"

3. **Combine with code context:**
   - Cursor sees both your code AND browser state
   - Get suggestions based on actual runtime behavior
   - Debug issues with full context

### For Testing

1. **Automated testing:**
   ```
   You: "Run the listActiveTabs tool and tell me what you see"
   ```

2. **Integration verification:**
   ```
   You: "Read all resources and summarize what's available"
   ```

3. **Performance analysis:**
   ```
   You: "Check the network requests and identify bottlenecks"
   ```

---

## 💡 Pro Tips

### Tip 1: Use Natural Language

Don't worry about exact resource URIs. Ask naturally:
- ✅ "What's in the browser console?"
- ✅ "Show me the page HTML"
- ✅ "What frameworks are running?"

Instead of:
- ❌ "Read browser://tab-localhost-3000/console/logs"

### Tip 2: Combine Context

Cursor can see both your code and browser state:
```
"I changed this component. Did it fix the console error?"
```

### Tip 3: Iterative Debugging

```
You: "Check the console errors"
Cursor: "I see a TypeError..."
You: "Suggest a fix"
Cursor: *proposes code change*
You: "Check if that fixed it"
Cursor: "The console is now clear!"
```

### Tip 4: Use with Cursor Rules

Add to `.cursorrules`:
```
When debugging:
1. Check browser console logs first
2. Verify framework versions
3. Analyze network requests
4. Read actual DOM structure
```

---

## 📚 Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [Cursor Documentation](https://cursor.sh/docs)
- [Browser MCP README](./README.md)
- [Testing Guide](./TESTING.md)

---

## 🎉 You're Ready!

Cursor can now access your browser state in real-time!

**Test it now:**

```bash
# 1. Verify config
cat ~/.cursor/mcp.json

# 2. Restart Cursor

# 3. Ask in chat:
"What MCP servers are available?"
```

**Then try:**
- "List browser resources"
- "What tools can you use?"
- "Show me what's in the active tab"

---

**Built with ❤️ for Cursor IDE integration**
