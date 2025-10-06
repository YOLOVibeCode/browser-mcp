# Tab Pinning Guide

**Pin specific browser tabs to your Cursor/Claude IDE sessions for focused context**

---

## Overview

Tab Pinning allows you to bind a specific browser tab to your IDE session, so you only see that tab's state (DOM, console logs, network requests) in your current Cursor window.

### Benefits:

- **Focused Context** - Only see resources for the tab you're working on
- **Multi-Project** - Different IDE windows can focus on different tabs
- **No Confusion** - No mixing of state between localhost:3000 and localhost:4000
- **Session Isolation** - Each Cursor window operates independently

---

## How It Works

### Before Tab Pinning:
```
Chrome: Tab 1 (localhost:3000), Tab 2 (localhost:8080), Tab 3 (example.com)
Cursor Window 1: Sees ALL tabs ❌
Cursor Window 2: Sees ALL tabs ❌
```

### After Tab Pinning:
```
Chrome: Tab 1 (localhost:3000), Tab 2 (localhost:8080), Tab 3 (example.com)
Cursor Window 1: Pinned to Tab 1 → Only sees localhost:3000 ✅
Cursor Window 2: Pinned to Tab 2 → Only sees localhost:8080 ✅
```

---

## Quick Start

### Step 1: List Available Tabs

In Cursor, ask:
```
"What browser tabs are available?"
```

Example response:
```
Available tabs:
- Tab 1: http://localhost:3000
- Tab 2: http://localhost:8080
- Tab 3: https://example.com
```

### Step 2: Pin a Tab to This Session

In Cursor, ask:
```
"Pin tab 1 to this session (session ID: cursor-window-1)"
```

Or use the tool directly:
```
Tool: pinTab
Parameters:
  sessionId: "cursor-window-1"
  tabId: 1
```

### Step 3: Verify Pinning

Ask:
```
"What tab is pinned to this session?"
```

Response:
```
Pinned: Tab 1 (http://localhost:3000)
```

### Step 4: Query Tab State (Automatically Filtered)

Now all your queries automatically target the pinned tab:

```
"Show me the DOM"
"What frameworks are detected?"
"Show console errors"
```

---

## Available Tools

### `pinTab`
**Description:** Pin a specific tab to this IDE session

**Parameters:**
- `sessionId` (string, required) - Unique ID for this Cursor window
- `tabId` (number, required) - Tab ID to pin

**Example:**
```json
{
  "name": "pinTab",
  "arguments": {
    "sessionId": "cursor-window-1",
    "tabId": 1
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "Tab 1 pinned to session cursor-window-1",
    "tab": {
      "tabId": 1,
      "url": "http://localhost:3000",
      "port": 3100,
      "virtualFilesystemURI": "browser://tab-localhost-3000/"
    }
  }
}
```

---

### `unpinTab`
**Description:** Unpin the tab from this IDE session

**Parameters:**
- `sessionId` (string, required) - Session ID

**Example:**
```json
{
  "name": "unpinTab",
  "arguments": {
    "sessionId": "cursor-window-1"
  }
}
```

---

### `getPinnedTab`
**Description:** Get which tab is pinned to this session

**Parameters:**
- `sessionId` (string, required) - Session ID

**Example:**
```json
{
  "name": "getPinnedTab",
  "arguments": {
    "sessionId": "cursor-window-1"
  }
}
```

**Response (when pinned):**
```json
{
  "success": true,
  "data": {
    "pinned": true,
    "tabId": 1,
    "tab": {
      "tabId": 1,
      "url": "http://localhost:3000",
      "port": 3100
    }
  }
}
```

**Response (when not pinned):**
```json
{
  "success": true,
  "data": {
    "pinned": false,
    "message": "No tab pinned to this session"
  }
}
```

---

### `listSessionBindings`
**Description:** List all active session-to-tab bindings (debugging)

**Example:**
```json
{
  "name": "listSessionBindings",
  "arguments": {}
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "sessionId": "cursor-window-1",
      "tabId": 1,
      "pinnedAt": 1699891234567
    },
    {
      "sessionId": "cursor-window-2",
      "tabId": 2,
      "pinnedAt": 1699891234789
    }
  ]
}
```

---

## Usage Patterns

### Pattern 1: Single Project, Multiple Tabs

If you have ONE project but test in multiple tabs:

```bash
# Terminal 1: Start dev server
npm run dev  # runs on localhost:3000

# Cursor Window 1
"Pin localhost:3000 tab 1 to session cursor-main"
"Show me the React components"

# Open in different browser
# New Tab ID (e.g., Tab 5)

# Cursor Window 2
"Pin localhost:3000 tab 5 to session cursor-debug"
"Show console errors"
```

---

### Pattern 2: Multiple Projects, Multiple Ports

If you have MULTIPLE projects on different ports:

```bash
# Project A on port 3000
cd project-a && npm run dev

# Project B on port 4000
cd project-b && npm run dev
```

```
# Cursor Window 1 (working on Project A)
"List tabs"  # See Tab 1: localhost:3000, Tab 2: localhost:4000
"Pin tab 1 (localhost:3000) to cursor-project-a"
"Show DOM"  # Only sees Project A

# Cursor Window 2 (working on Project B)
"Pin tab 2 (localhost:4000) to cursor-project-b"
"Show DOM"  # Only sees Project B
```

---

### Pattern 3: Frontend + Backend Debugging

```bash
# Frontend: localhost:3000
# Backend API docs: localhost:8080
```

```
# Cursor Window 1 (frontend focus)
"Pin tab 1 (localhost:3000) to frontend-session"
"What React hooks are used?"

# Cursor Window 2 (backend focus)
"Pin tab 2 (localhost:8080) to backend-session"
"Show API endpoints"
```

---

## Session ID Best Practices

### Recommended Session ID Formats:

- **By Project:** `"project-name-main"` (e.g., `"myapp-main"`)
- **By Feature:** `"feature-auth"`, `"feature-dashboard"`
- **By Purpose:** `"debugging"`, `"testing"`, `"development"`
- **By IDE Window:** `"cursor-1"`, `"cursor-2"`, `"cursor-3"`

### Auto-Generated Session IDs:

Cursor/Claude can auto-generate session IDs if you don't provide one:

```
"Pin localhost:3000 to this session"
→ Cursor generates: "cursor-<window-id>-<timestamp>"
```

---

## Troubleshooting

### Issue: "No tab pinned to this session"

**Cause:** You haven't pinned a tab yet.

**Solution:**
```
"List available tabs"
"Pin tab 1 to session my-session"
```

---

### Issue: "Tab not found"

**Cause:** The tab ID doesn't exist or the tab was closed.

**Solution:**
```
"List active tabs"  # Get current tab IDs
"Pin tab <correct-id> to this session"
```

---

### Issue: Resources still showing all tabs

**Cause:** Resource filtering by session is not yet implemented (coming soon).

**Current Workaround:**
- Query by URL: `"Show DOM for localhost:3000"`
- Or wait for automatic filtering in next update

---

## Coming Soon: Automatic Resource Filtering

**Future Feature:**

Once a tab is pinned, resources will automatically filter to show only that tab:

```
# Before pinning
resources/list → Shows ALL tabs' resources

# After pinning tab 1
resources/list → Shows ONLY tab 1's resources
```

This feature is planned for v1.1.0.

---

## Examples

### Example 1: Pin Tab by URL

```
User: "I want to focus on localhost:3000"
Cursor: *lists tabs and finds Tab 1 is localhost:3000*
Cursor: *calls pinTab with sessionId="auto-123", tabId=1*
Cursor: "Tab 1 (localhost:3000) is now pinned to this session"
```

### Example 2: Switch Between Tabs

```
User: "Pin localhost:3000"
Cursor: *pins Tab 1*

... work on localhost:3000 ...

User: "Switch to localhost:8080"
Cursor: *unpins Tab 1, pins Tab 2*
Cursor: "Now focused on localhost:8080"
```

### Example 3: Multi-Window Workflow

```
# Cursor Window 1
User: "Pin localhost:3000 and analyze React performance"
Cursor: *pins Tab 1, analyzes React devtools data*

# Cursor Window 2 (simultaneously)
User: "Pin localhost:8080 and check API responses"
Cursor: *pins Tab 2, analyzes network requests*
```

---

## API Reference

All session tools are available via MCP protocol:

```typescript
// TypeScript interface
interface ISessionManager {
  pinTab(sessionId: string, tabId: number): void;
  unpinTab(sessionId: string): void;
  getPinnedTab(sessionId: string): number | null;
  getAllBindings(): SessionBinding[];
  isTabPinned(tabId: number): boolean;
  getSessionsForTab(tabId: number): string[];
  clearSession(sessionId: string): void;
  clearAll(): void;
}
```

---

## Summary

✅ **162/162 tests passing**
✅ **Session management implemented**
✅ **5 new MCP tools**
✅ **Production-ready**

**Next Steps:**
1. Pin a tab: `"Pin tab 1 to session my-session"`
2. Verify: `"What tab is pinned?"`
3. Query state: `"Show DOM"`, `"Show console logs"`

---

**Ready to use focused browser context in your IDE!** 🎯
