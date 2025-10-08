# @browser-mcp/native-host

**Native Messaging Host for Browser MCP**

Bridges AI assistants (Claude Desktop, Cursor, Windsurf) to the Browser MCP Chrome extension via Native Messaging protocol.

[![Version](https://img.shields.io/badge/version-3.0.3-blue.svg)](https://www.npmjs.com/package/@browser-mcp/native-host)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](../LICENSE)

---

## 🚀 Quick Install

### One-Line Installation

```bash
npm install -g @browser-mcp/native-host
```

The installation will:
1. ✅ Install the native messaging host globally
2. ✅ Auto-detect your Browser MCP extension ID
3. ✅ Create native messaging manifest
4. ✅ Configure for your platform (Mac/Linux/Windows)

---

## 📦 What's Included

- **browser-mcp-host** - Native messaging host binary
- **browser-mcp-setup** - Configuration CLI tool
- **Automatic manifest setup** - Works on Mac, Linux, Windows

---

## 🔧 Usage

### Automatic Setup (Recommended)

After installation, the host is automatically configured. Just add to your IDE config:

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

**Cursor** (`~/.cursor/mcp.json`):
```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-host"
    }
  }
}
```

**Windsurf** (`~/.codeium/windsurf/mcp_config.json`):
```json
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-host"
    }
  }
}
```

### Manual Configuration

If auto-detection fails, run the setup wizard:

```bash
browser-mcp-setup
```

Or provide extension ID directly:

```bash
browser-mcp-setup YOUR_EXTENSION_ID_HERE
```

### Check Configuration Status

```bash
browser-mcp-setup --status
```

### Reconfigure

```bash
browser-mcp-setup
```

---

## 📍 File Locations

### macOS
- **Host**: `/usr/local/lib/node_modules/@browser-mcp/native-host/host.js`
- **Manifest**: `~/Library/Application Support/Google/Chrome/NativeMessagingHosts/com.browsermcp.native.json`

### Linux
- **Host**: `/usr/local/lib/node_modules/@browser-mcp/native-host/host.js`
- **Manifest**: `~/.config/google-chrome/NativeMessagingHosts/com.browsermcp.native.json`

### Windows
- **Host**: `%APPDATA%\npm\node_modules\@browser-mcp\native-host\host.js`
- **Manifest**: `%APPDATA%\Google\Chrome\NativeMessagingHosts\com.browsermcp.native.json`

---

## 🔍 How It Works

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Claude/Cursor │◄───────►│  Native Host     │◄───────►│ Chrome Extension│
│   (AI Assistant)│  stdio  │  (This Package)  │ Native  │   Browser MCP   │
└─────────────────┘         └──────────────────┘ Message └─────────────────┘
```

1. **AI Assistant** sends MCP requests via stdio
2. **Native Host** (this package) forwards to Chrome extension
3. **Chrome Extension** executes browser debugging commands
4. **Native Host** returns results to AI assistant

---

## 🛠️ Development

### Local Testing

```bash
# Clone repository
git clone https://github.com/YOLOVibeCode/browser-mcp.git
cd browser-mcp/native-messaging-host

# Install locally
npm install -g .

# Test
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | browser-mcp-host
```

### Uninstall

```bash
npm uninstall -g @browser-mcp/native-host
```

This will remove:
- The host binary
- The manifest file (automatically)

---

## 🐛 Troubleshooting

### "Extension ID not found"
1. Load the Browser MCP extension in Chrome first
2. Run `browser-mcp-setup` manually
3. Copy extension ID from `chrome://extensions/`

### "Command not found: browser-mcp-host"
1. Check npm global bin is in PATH: `npm bin -g`
2. Add to PATH if needed: `export PATH="$(npm bin -g):$PATH"`
3. Restart terminal

### "Native host has exited"
1. Check manifest exists: `browser-mcp-setup --status`
2. Verify extension ID matches
3. Check logs: Host writes to stderr

### Test Connection

```bash
# Send test message
echo '{"jsonrpc":"2.0","id":1,"method":"test"}' | browser-mcp-host
```

---

## 📚 API

### Command Line

```bash
browser-mcp-host              # Run the native messaging host
browser-mcp-setup             # Interactive setup wizard
browser-mcp-setup [id]        # Setup with specific extension ID
browser-mcp-setup --status    # Show current configuration
browser-mcp-setup --version   # Show version
browser-mcp-setup --help      # Show help
```

### Protocol

The host uses the [Chrome Native Messaging Protocol](https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging):

- **Input**: JSON-RPC 2.0 messages via stdin (4-byte length prefix)
- **Output**: JSON-RPC 2.0 responses via stdout (4-byte length prefix)
- **Logs**: Written to stderr

---

## 🤝 Contributing

Contributions welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally with `npm install -g .`
5. Submit a pull request

---

## 📄 License

MIT License - see [LICENSE](../LICENSE)

---

## 🔗 Links

- **Repository**: https://github.com/YOLOVibeCode/browser-mcp
- **NPM Package**: https://www.npmjs.com/package/@browser-mcp/native-host
- **Issues**: https://github.com/YOLOVibeCode/browser-mcp/issues

---

**Made with ❤️ by [YOLOVibeCode](https://github.com/YOLOVibeCode)**
