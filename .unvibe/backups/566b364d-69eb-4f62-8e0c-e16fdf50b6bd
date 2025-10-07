#!/bin/bash
echo "🚀 Quick Test - Browser MCP Family"
echo "==================================="
echo ""

echo "1️⃣ Running unit tests..."
npm test -- --run 2>&1 | tail -5
echo ""

echo "2️⃣ Testing MCP server JSON-RPC..."
cd mcp-server
echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | timeout 3 node dist/index.js 2>/dev/null | head -1
echo ""

echo "3️⃣ Checking build outputs..."
if [ -f "dist/index.js" ]; then
    echo "✅ MCP server built"
else
    echo "❌ MCP server not built"
fi

if [ -f "../extension-chromium/dist/manifest.json" ]; then
    echo "✅ Extension built"
else
    echo "❌ Extension not built"
fi
echo ""

echo "==================================="
echo "✅ Quick test complete!"
echo ""
echo "Next steps:"
echo "  1. Load extension: chrome://extensions/"
echo "  2. Configure Claude Desktop (see TESTING.md)"
echo "  3. Run full test: ./test-e2e.sh"
