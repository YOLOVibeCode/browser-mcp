# 🚀 Quick Setup - Browser MCP Family

## The Fastest Way to Get Started

### 1. Run the Automatic Setup (30 seconds)

```bash
cd /Users/xcode/Documents/YOLOProjects/browser-mcp
./setup-mcp.sh
```

**This single command will:**
- ✅ Detect Claude Desktop, Cursor IDE, and/or Windsurf IDE
- ✅ Configure all detected IDEs automatically
- ✅ Backup any existing configs
- ✅ Test the MCP server
- ✅ Show you exactly what's next

### 2. Restart Your IDE

- **Claude Desktop**: Quit completely (Cmd+Q), then reopen
- **Cursor IDE**: Quit completely (Cmd+Q), then reopen
- **Windsurf IDE**: Quit completely (Cmd+Q), then reopen

### 3. Test It!

Open your IDE and ask:
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

## ✅ What Got Configured

### Claude Desktop
- **Config location**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Server**: `browser-inspector`
- **Command**: Runs Node.js MCP server via stdio

### Cursor IDE
- **Config location**: `~/.cursor/mcp.json`
- **Server**: `browser-inspector`
- **Command**: Runs Node.js MCP server via stdio

### Windsurf IDE
- **Config location**: `~/.codeium/windsurf/mcp_config.json`
- **Server**: `browser-inspector`
- **Command**: Runs Node.js MCP server via stdio

All IDEs now have access to:
- 📄 Virtual filesystem (browser state)
- 🔧 Tools (list tabs, get info)
- 📝 Prompts (analyze tab)

---

## 🎯 Quick Commands

```bash
# Automatic setup (do this first!)
./setup-mcp.sh

# Quick test
./test-quick.sh

# Interactive demo
./demo.sh

# Run all tests
npm test -- --run

# Load Chrome extension
# Go to: chrome://extensions/
# Load: extension-chromium/dist/
```

---

## 📚 Full Documentation

- **[START_HERE.md](./START_HERE.md)** - Complete getting started guide
- **[CURSOR_INTEGRATION.md](./CURSOR_INTEGRATION.md)** - Cursor IDE guide
- **[WINDSURF_INTEGRATION.md](./WINDSURF_INTEGRATION.md)** - Windsurf IDE guide
- **[QUICKSTART.md](./QUICKSTART.md)** - 5-minute manual setup
- **[TESTING.md](./TESTING.md)** - Comprehensive testing
- **[README.md](./README.md)** - Full overview

---

## 🐛 Troubleshooting

### Setup script issues?

```bash
# Run with verbose output
bash -x ./setup-mcp.sh
```

### MCP server not showing in IDE?

1. Check config was created:
```bash
# Cursor
cat ~/.cursor/mcp.json

# Claude Desktop
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Windsurf
cat ~/.codeium/windsurf/mcp_config.json
```

2. Verify path is correct (absolute path required)

3. Restart IDE completely (Cmd+Q, not just close window)

### Still having issues?

See IDE-specific guides:
- **[CURSOR_INTEGRATION.md](./CURSOR_INTEGRATION.md)** - Troubleshooting
- **[WINDSURF_INTEGRATION.md](./WINDSURF_INTEGRATION.md)** - Troubleshooting

---

## 🎊 You're Done!

**Total time:** ~2 minutes

1. ✅ Run `./setup-mcp.sh`
2. ✅ Restart your IDE
3. ✅ Ask "What MCP servers are available?"
4. ✅ Start using browser state in AI!

---

**That's it!** The setup utility handles everything automatically. 🚀
