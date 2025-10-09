# How to Properly Reload Chrome Extension

The extension code has been updated but Chrome needs to reload it completely.

## Steps:

1. **Go to:** `chrome://extensions/`

2. **Find:** "Browser MCP v4.0.2"

3. **Click the RELOAD button** (circular arrow icon)
   - NOT just refresh the service worker
   - Click the actual extension reload button

4. **If that doesn't work, do a hard reload:**
   - Click "Remove" button
   - Then click "Load unpacked" again
   - Select: `/Users/xcode/Documents/YOLOProjects/browser-mcp/browser-mcp-extension`

5. **Click "service worker"** link to open console

6. **You should now see detailed error messages like:**
   ```
   [WebSocketServer] ❌ Port 8765 failed: ADDRESS_IN_USE (code: -102)
   ```
   
   Instead of just:
   ```
   [WebSocketServer] Port 8765 busy, trying next...
   ```

## The Error Code is Critical!

Once you see the actual error code (like `-102`, `-147`, etc.), we'll know exactly what's wrong:

- **-102** = Port actually in use (rare)
- **-147** = Address invalid (permissions issue)
- **-4** = Invalid operation (API restriction)
- **-15** = Socket not connected (initialization issue)

Please try a hard reload (remove + re-add extension) and share the error code!

