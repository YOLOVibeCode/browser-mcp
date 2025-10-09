#!/bin/bash

###############################################################################
# Full Stack Integration Test for Browser MCP v4.0.4
# Tests the complete flow: MCP Server → Extension → Tools
###############################################################################

set -e

echo "=================================="
echo "Browser MCP v4.0.4 Full Stack Test"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if MCP server is running
echo "Step 1: Checking if MCP server is running..."
if lsof -i :8765 | grep -q LISTEN; then
    echo -e "${GREEN}✅ MCP server is running on port 8765${NC}"
else
    echo -e "${RED}❌ MCP server is NOT running${NC}"
    echo ""
    echo "Please start the MCP server first:"
    echo "  cd mcp-server && node index.js"
    exit 1
fi

# Step 2: Test WebSocket connection
echo ""
echo "Step 2: Testing WebSocket connection..."
node test-websocket-direct.js || {
    echo -e "${RED}❌ WebSocket connection failed${NC}"
    exit 1
}

echo -e "${GREEN}✅ WebSocket connection successful${NC}"

# Step 3: Check Chrome extension
echo ""
echo "Step 3: Manual Chrome extension check required"
echo ""
echo "Please verify in Chrome:"
echo "  1. Go to chrome://extensions/"
echo "  2. Find 'Browser MCP v4.0.3'"
echo "  3. Version should show: v4.0.4"
echo "  4. Click 'service worker' to open console"
echo "  5. Look for: '✅ Connected to MCP server'"
echo ""
read -p "Press Enter when extension is loaded and connected..."

# Step 4: Run integration tests
echo ""
echo "Step 4: Running integration tests..."
echo ""

# Run WebSocket integration test
echo "Testing WebSocket integration..."
npm run test:integration:ws --silent

# Run MCP integration test
echo ""
echo "Testing MCP server integration..."
npm run test:integration:mcp --silent

echo ""
echo "=================================="
echo -e "${GREEN}✅ FULL STACK TEST COMPLETE${NC}"
echo "=================================="
echo ""
echo "Architecture flip successful!"
echo "MCP Server (WebSocket SERVER) ← Extension (WebSocket CLIENT)"
echo ""

