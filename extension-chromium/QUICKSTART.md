# 🚀 Quick Start Guide

Get Browser MCP running in 2 minutes!

## 📦 Installation

### Step 1: Install the Chrome Extension

1. Open Chrome and go to `chrome://extensions/`
2. Enable **"Developer mode"** (toggle in top right)
3. Click **"Load unpacked"**
4. Select the `extension-chromium/dist/` folder
5. You should see "Browser Inspector for AI" appear ✅

### Step 2: Start the Companion App

Open a terminal and run:

```bash
cd browser-mcp
npm run companion
```

This will:
- ✅ Start the MCP server on port 3100
- ✅ Open a status page in your browser
- ✅ Enable the extension to auto-detect the server

**Keep this terminal window open!** 💡

## 🎯 Connect Your First Tab

1. **Open Chrome** and navigate to any website (e.g., `https://example.com`)
2. **Click the extension icon** in your toolbar
3. **Click "📖 View Setup Guide"** if it's your first time
4. **Click "Connect This Tab"**
5. **Done!** 🎉 Your tab is now connected

## ✨ What You Can Do Now

Once connected, you can use AI assistants to:

- 🔍 **Inspect DOM elements** on the page
- 📊 **Analyze network requests**
- 🎨 **Debug CSS and styles**
- ⚡ **Profile performance**
- 🐛 **Find bugs faster**

## 🆘 Troubleshooting

### Extension shows "Server not running"

Make sure the companion app is running:
```bash
npm run companion
```

Check the status page at: `http://localhost:3100`

### Can't connect a tab

1. Make sure the companion app is running
2. Click the extension icon
3. Click "📖 View Setup Guide" for step-by-step help
4. Reload the extension if needed

### Port 3100 already in use

Kill the process using port 3100:
```bash
lsof -i :3100
kill -9 <PID>
```

## 💡 Tips

- **Keep terminal open**: The companion app needs to run while you use the extension
- **Check status page**: Visit `http://localhost:3100` to see server status
- **Use setup guide**: Click "📖 View Setup Guide" in the extension for help
- **Reload extension**: If something breaks, reload the extension in Chrome

---

**Happy debugging!** 🎉

Need help? Open an issue or check the full documentation.
