#!/bin/bash

echo "🎯 Cursor IDE Integration Setup"
echo "================================"
echo ""

# Get absolute path
PROJECT_PATH=$(pwd)
echo "📍 Project path: $PROJECT_PATH"
echo ""

# Create config directory
echo "1️⃣ Creating Cursor config directory..."
mkdir -p ~/.cursor
echo "   ✅ Created ~/.cursor/"
echo ""

# Create config file
echo "2️⃣ Creating MCP configuration..."
cat > ~/.cursor/mcp.json << EOFCONFIG
{
  "mcpServers": {
    "browser-inspector": {
      "command": "node",
      "args": [
        "$PROJECT_PATH/mcp-server/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOFCONFIG

echo "   ✅ Created ~/.cursor/mcp.json"
echo ""

# Verify config
echo "3️⃣ Verifying configuration..."
if [ -f ~/.cursor/mcp.json ]; then
    echo "   ✅ Config file exists"
    echo ""
    echo "   Config contents:"
    cat ~/.cursor/mcp.json | sed 's/^/      /'
else
    echo "   ❌ Config file not created"
    exit 1
fi
echo ""

# Test server
echo "4️⃣ Testing MCP server..."
if [ -f "$PROJECT_PATH/mcp-server/dist/index.js" ]; then
    echo "   ✅ Server file exists"
    
    # Test it runs
    echo ""
    echo "   Testing JSON-RPC..."
    RESPONSE=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | timeout 2 node "$PROJECT_PATH/mcp-server/dist/index.js" 2>/dev/null)
    
    if echo "$RESPONSE" | grep -q "Browser MCP Server"; then
        echo "   ✅ Server responds correctly"
    else
        echo "   ⚠️  Server may have issues (but config is set up)"
    fi
else
    echo "   ❌ Server not built. Run: npm run build"
    exit 1
fi
echo ""

# Instructions
echo "================================"
echo "✅ Setup Complete!"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Restart Cursor IDE (Cmd+Q, then reopen)"
echo ""
echo "2. Open Cursor and test:"
echo "   • Open chat (Cmd+L)"
echo "   • Ask: 'What MCP servers are available?'"
echo "   • Should see: 'browser-inspector'"
echo ""
echo "3. Try these commands:"
echo "   • 'List browser resources'"
echo "   • 'What browser tools can you use?'"
echo "   • 'Show me active browser tabs'"
echo ""
echo "📚 Full guide: CURSOR_INTEGRATION.md"
echo ""
echo "🐛 Issues? Check: CURSOR_INTEGRATION.md (Troubleshooting section)"
echo ""
