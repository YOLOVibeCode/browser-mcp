#!/bin/bash

# Browser MCP Health Check Script
# Validates that all components of the MCP harness are working

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo ""
echo "============================================"
echo "   Browser MCP Health Check v1.0"
echo "============================================"
echo ""

ERRORS=0
WARNINGS=0

# Check 1: Server process
echo -e "${BLUE}[1/6]${NC} Checking MCP Server process..."
if pgrep -f "browser-mcp-server\|mcp-server/index.js" > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ MCP Server is running${NC}"
    SERVER_PID=$(pgrep -f "browser-mcp-server\|mcp-server/index.js" | head -1)
    echo "     PID: $SERVER_PID"
else
    echo -e "${RED}  ❌ MCP Server is NOT running${NC}"
    echo -e "${YELLOW}     Start with: node mcp-server/index.js${NC}"
    ((ERRORS++))
fi
echo ""

# Check 2: WebSocket port
echo -e "${BLUE}[2/6]${NC} Checking WebSocket server port 8765..."
if lsof -i :8765 > /dev/null 2>&1; then
    echo -e "${GREEN}  ✅ WebSocket server listening on port 8765${NC}"
    PORT_INFO=$(lsof -i :8765 | tail -1)
    echo "     $PORT_INFO"
else
    echo -e "${RED}  ❌ WebSocket server NOT listening on port 8765${NC}"
    echo -e "${YELLOW}     Server may not be started or using different port${NC}"
    ((ERRORS++))
fi
echo ""

# Check 3: Health endpoint
echo -e "${BLUE}[3/6]${NC} Checking HTTP health endpoint..."
HEALTH=""
for PORT in 8766 8767 8768 8769 8770; do
    HEALTH=$(curl -s http://localhost:$PORT/health 2>/dev/null || echo "")
    if [ -n "$HEALTH" ]; then
        echo -e "${GREEN}  ✅ Health endpoint responding on port $PORT${NC}"
        echo "     $HEALTH"
        
        # Check WebSocket connection status
        if echo "$HEALTH" | grep -q '"websocketConnected":true'; then
            echo -e "${GREEN}  ✅ Extension is connected via WebSocket${NC}"
        else
            echo -e "${YELLOW}  ⚠️  Extension is NOT connected yet${NC}"
            echo -e "${YELLOW}     Load extension in Chrome: chrome://extensions/${NC}"
            ((WARNINGS++))
        fi
        break
    fi
done

if [ -z "$HEALTH" ]; then
    echo -e "${YELLOW}  ⚠️  Health endpoint not responding (ports 8766-8770)${NC}"
    echo -e "${YELLOW}     This is optional, server may still work${NC}"
    ((WARNINGS++))
fi
echo ""

# Check 4: Extension files
echo -e "${BLUE}[4/6]${NC} Checking Chrome extension files..."
if [ -f "browser-mcp-extension/manifest.json" ]; then
    echo -e "${GREEN}  ✅ Extension manifest.json exists${NC}"
    VERSION=$(grep '"version"' browser-mcp-extension/manifest.json | head -1 | sed 's/.*: *"\([^"]*\)".*/\1/')
    echo "     Version: $VERSION"
else
    echo -e "${RED}  ❌ Extension manifest.json NOT found${NC}"
    ((ERRORS++))
fi

if [ -f "browser-mcp-extension/background/service-worker.js" ]; then
    echo -e "${GREEN}  ✅ Service worker exists${NC}"
else
    echo -e "${RED}  ❌ Service worker NOT found${NC}"
    ((ERRORS++))
fi

if [ -f "browser-mcp-extension/background/websocket-client.js" ]; then
    echo -e "${GREEN}  ✅ WebSocket client exists${NC}"
else
    echo -e "${RED}  ❌ WebSocket client NOT found${NC}"
    ((ERRORS++))
fi
echo ""

# Check 5: Node.js and dependencies
echo -e "${BLUE}[5/6]${NC} Checking Node.js and dependencies..."
if command -v node > /dev/null 2>&1; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}  ✅ Node.js installed: $NODE_VERSION${NC}"
else
    echo -e "${RED}  ❌ Node.js NOT installed${NC}"
    ((ERRORS++))
fi

if [ -f "package.json" ]; then
    echo -e "${GREEN}  ✅ package.json exists${NC}"
    
    if [ -d "node_modules" ]; then
        echo -e "${GREEN}  ✅ node_modules installed${NC}"
    else
        echo -e "${YELLOW}  ⚠️  node_modules NOT installed${NC}"
        echo -e "${YELLOW}     Run: npm install${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}  ❌ package.json NOT found${NC}"
    ((ERRORS++))
fi
echo ""

# Check 6: WebSocket connection test
echo -e "${BLUE}[6/6]${NC} Testing WebSocket connection..."
if command -v wscat > /dev/null 2>&1; then
    if lsof -i :8765 > /dev/null 2>&1; then
        # Create a test request file
        TEST_REQUEST='{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
        
        # Try to connect and send request (with 5 second timeout)
        RESPONSE=$(echo "$TEST_REQUEST" | timeout 5 wscat -c ws://localhost:8765 2>/dev/null | tail -1 || echo "")
        
        if echo "$RESPONSE" | grep -q '"tools"'; then
            TOOL_COUNT=$(echo "$RESPONSE" | grep -o '"name"' | wc -l | tr -d ' ')
            echo -e "${GREEN}  ✅ WebSocket connection works!${NC}"
            echo "     Tools available: $TOOL_COUNT"
            
            if [ "$TOOL_COUNT" -eq 33 ]; then
                echo -e "${GREEN}  ✅ All 33 tools are available${NC}"
            else
                echo -e "${YELLOW}  ⚠️  Expected 33 tools, found $TOOL_COUNT${NC}"
                ((WARNINGS++))
            fi
        else
            echo -e "${YELLOW}  ⚠️  WebSocket connection failed or extension not ready${NC}"
            echo -e "${YELLOW}     Make sure extension is loaded in Chrome${NC}"
            ((WARNINGS++))
        fi
    else
        echo -e "${YELLOW}  ⚠️  Cannot test: WebSocket server not running${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${YELLOW}  ⚠️  wscat not installed (optional)${NC}"
    echo -e "${YELLOW}     Install with: npm install -g wscat${NC}"
    ((WARNINGS++))
fi
echo ""

# Summary
echo "============================================"
echo "   Health Check Summary"
echo "============================================"
echo ""

if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✅ PERFECT! MCP harness is fully operational${NC}"
    echo ""
    echo "Ready to use:"
    echo "  • Run automated tests: npm run test:ai:dialogue"
    echo "  • Test with real AI: Configure Claude/Cursor"
    echo "  • Run all tests: ./tests/run-all-integration-tests.sh"
    echo ""
    exit 0
    
elif [ $ERRORS -eq 0 ]; then
    echo -e "${YELLOW}⚠️  MCP harness is mostly working${NC}"
    echo -e "   Warnings: $WARNINGS"
    echo ""
    echo "Recommendations:"
    if lsof -i :8765 > /dev/null 2>&1; then
        echo "  1. Load extension in Chrome: chrome://extensions/"
        echo "  2. Click 'Load unpacked'"
        echo "  3. Select: $(pwd)/browser-mcp-extension"
        echo "  4. Run health check again: ./health-check.sh"
    else
        echo "  1. Start MCP server: node mcp-server/index.js"
        echo "  2. Load extension in Chrome"
        echo "  3. Run health check again"
    fi
    echo ""
    exit 0
    
else
    echo -e "${RED}❌ MCP harness has issues${NC}"
    echo -e "   Errors: $ERRORS"
    echo -e "   Warnings: $WARNINGS"
    echo ""
    echo "Required actions:"
    
    if ! pgrep -f "browser-mcp-server\|mcp-server/index.js" > /dev/null 2>&1; then
        echo -e "${RED}  1. Start MCP server:${NC}"
        echo "     cd $(pwd)"
        echo "     node mcp-server/index.js"
        echo ""
    fi
    
    if ! lsof -i :8765 > /dev/null 2>&1; then
        echo -e "${RED}  2. Verify WebSocket server started${NC}"
        echo "     Check server logs for errors"
        echo ""
    fi
    
    if [ ! -f "browser-mcp-extension/manifest.json" ]; then
        echo -e "${RED}  3. Extension files missing${NC}"
        echo "     Verify repository is complete"
        echo ""
    fi
    
    echo "After fixing issues, run: ./health-check.sh"
    echo ""
    exit 1
fi


