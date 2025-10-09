#!/bin/bash

###############################################################################
# Start MCP Server for Browser MCP v4.0.4
# Automatically clears port 8765 if occupied
###############################################################################

echo "╔════════════════════════════════════════╗"
echo "║  Browser MCP Server Startup v4.0.4    ║"
echo "╚════════════════════════════════════════╝"
echo ""

# Check if port 8765 is in use
if lsof -i :8765 | grep -q LISTEN; then
    echo "⚠️  Port 8765 is occupied. Clearing..."
    lsof -ti:8765 | xargs kill -9 2>/dev/null
    sleep 1
    echo "✅ Port 8765 cleared"
    echo ""
fi

# Start MCP server
echo "🚀 Starting MCP Server..."
echo "   Port: 8765"
echo "   Mode: WebSocket SERVER"
echo ""
echo "───────────────────────────────────────"
echo ""

cd mcp-server && node index.js

