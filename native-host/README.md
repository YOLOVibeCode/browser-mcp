# Browser MCP Native Messaging Host

This native host enables the Browser MCP Chrome extension to **automatically write configuration files** to your IDE's config directory.

## 🎯 What It Does

- **Writes config files directly** to `~/.cursor/mcp.json`, `~/Library/Application Support/Claude/`, etc.
- **Creates directories** if they don't exist
- **Merges with existing configs** intelligently
- **Validates paths** and provides helpful error messages

## 📦 Installation

### Quick Install

```bash
cd native-host
./setup.sh
```

### Manual Install with Extension ID

After loading the extension in Chrome:

1. Go to `chrome://extensions/`
2. Find "Browser Inspector for AI"
3. Copy the **Extension ID** (long alphanumeric string)
4. Run:

```bash
cd native-host
./setup.sh <YOUR_EXTENSION_ID>
```

Example:
```bash
./setup.sh abcdefghijklmnopqrstuvwxyz123456
```

## 🧪 Testing

Test the native host directly:

```bash
cd native-host
echo '{"type":"PING"}' | node host.js
```

Expected output:
```json
{"success":true,"message":"pong"}
```

## 🔧 How It Works

### Native Messaging Protocol

1. **Chrome Extension** sends JSON messages via stdin
2. **Native Host** (Node.js script) processes them
3. **Responses** are sent back via stdout

Messages are length-prefixed:
- First 4 bytes: message length (uint32, little-endian)
- Remaining bytes: JSON message

### Supported Operations

#### Write Config
```json
{
  "type": "WRITE_CONFIG",
  "path": "~/.cursor/mcp.json",
  "content": { ...config... },
  "merge": true
}
```

Response:
```json
{
  "success": true,
  "path": "/Users/you/.cursor/mcp.json",
  "message": "Configuration written successfully"
}
```

#### Read Config
```json
{
  "type": "READ_CONFIG",
  "path": "~/.cursor/mcp.json"
}
```

Response:
```json
{
  "success": true,
  "path": "/Users/you/.cursor/mcp.json",
  "content": { ...existing config... }
}
```

#### Ping (Test Connection)
```json
{
  "type": "PING"
}
```

Response:
```json
{
  "success": true,
  "message": "pong"
}
```

## 📁 Files

- **host.js** - Main native host script (Node.js)
- **install.js** - Installation script
- **setup.sh** - Convenience wrapper for installation
- **package.json** - npm package configuration

## 🗂️ Installation Locations

### macOS
```
~/Library/Application Support/Google/Chrome/NativeMessagingHosts/
  └── com.browser_mcp.native_host.json
```

### Linux
```
~/.config/google-chrome/NativeMessagingHosts/
  └── com.browser_mcp.native_host.json
```

### Windows
```
%LOCALAPPDATA%\Google\Chrome\User Data\NativeMessagingHosts\
  └── com.browser_mcp.native_host.json
```

## 🔐 Security

- The native host only accepts connections from the Browser MCP extension (verified by Extension ID)
- It runs with your user permissions (can only write files you can write)
- All operations are logged to stderr for auditing
- Open source - you can inspect the code!

## 🐛 Troubleshooting

### Native host not connecting

**Check if installed:**
```bash
ls -la ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/
cat ~/Library/Application\ Support/Google/Chrome/NativeMessagingHosts/com.browser_mcp.native_host.json
```

**Check Extension ID:**
The `allowed_origins` in the manifest must match your extension ID:
```json
{
  "allowed_origins": [
    "chrome-extension://YOUR_ACTUAL_EXTENSION_ID/"
  ]
}
```

**Reinstall with correct ID:**
```bash
./setup.sh <CORRECT_EXTENSION_ID>
```

### Permission errors

The native host runs as your user and can only write to locations you have permission to access.

**Check permissions:**
```bash
ls -la ~/.cursor/
ls -la ~/Library/Application\ Support/Claude/
```

### Test manually

```bash
cd native-host
echo '{"type":"WRITE_CONFIG","path":"~/test-config.json","content":{"test":"works"},"merge":false}' | node host.js
cat ~/test-config.json
```

## 📝 Logs

The native host logs to stderr (visible in Chrome's extension console):

```
Chrome DevTools > Extensions > Browser Inspector for AI > Service Worker > Console
```

## 🚀 Usage Flow

1. User opens Browser MCP extension
2. User follows setup wizard
3. User enters project path
4. User clicks "Write Configuration Automatically"
5. Extension sends message to native host via Native Messaging
6. Native host writes config file
7. Native host responds with success/error
8. Extension shows success message
9. Done! ✅

## 🔄 Updates

To update the native host:

```bash
cd native-host
git pull  # or download latest version
./setup.sh <YOUR_EXTENSION_ID>
```

The manifest will be updated with the new host path.

## 📚 Resources

- [Chrome Native Messaging Documentation](https://developer.chrome.com/docs/apps/nativeMessaging/)
- [Browser MCP Documentation](../README.md)

## 💡 Alternative: Manual Install

If you prefer not to use the native host, the extension falls back to downloading the config file. You then move it manually to the correct location.

The native host is **optional but recommended** for the best experience!
