#!/bin/bash

# Validate Test Infrastructure
# Checks that all test files exist and are properly configured

set -e

echo "======================================"
echo "Test Infrastructure Validation"
echo "======================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

echo "Checking test files..."
echo "----------------------"

# Check integration tests
FILES=(
    "tests/integration/message-routing.e2e.spec.js"
    "tests/integration/reconnection.e2e.spec.js"
    "tests/tools/tool-validation.e2e.spec.js"
    "tests/performance/benchmark.e2e.spec.js"
    "tests/run-all-integration-tests.sh"
)

for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (MISSING)"
        ((ERRORS++))
    fi
done

echo ""
echo "Checking package.json scripts..."
echo "---------------------------------"

SCRIPTS=(
    "test"
    "test:unit"
    "test:e2e"
    "test:integration:all"
    "test:integration:routing"
    "test:integration:reconnection"
    "test:tools:validation"
    "test:performance"
)

for script in "${SCRIPTS[@]}"; do
    if grep -q "\"$script\":" package.json; then
        echo -e "${GREEN}✓${NC} npm run $script"
    else
        echo -e "${RED}✗${NC} npm run $script (MISSING)"
        ((ERRORS++))
    fi
done

echo ""
echo "Checking dependencies..."
echo "------------------------"

if [ -f "package.json" ]; then
    echo -e "${GREEN}✓${NC} package.json exists"
    
    # Check for required dependencies
    if grep -q "\"@playwright/test\"" package.json; then
        echo -e "${GREEN}✓${NC} @playwright/test"
    else
        echo -e "${RED}✗${NC} @playwright/test (MISSING)"
        ((ERRORS++))
    fi
    
    if grep -q "\"ws\"" package.json; then
        echo -e "${GREEN}✓${NC} ws (WebSocket library)"
    else
        echo -e "${RED}✗${NC} ws (MISSING)"
        ((ERRORS++))
    fi
else
    echo -e "${RED}✗${NC} package.json (MISSING)"
    ((ERRORS++))
fi

echo ""
echo "Checking documentation..."
echo "-------------------------"

DOCS=(
    "ARCHITECTURE_TEST_SPECIFICATION.md"
    "TEST_IMPLEMENTATION_COMPLETE.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓${NC} $doc"
    else
        echo -e "${YELLOW}⚠${NC} $doc (OPTIONAL)"
        ((WARNINGS++))
    fi
done

echo ""
echo "Checking MCP server..."
echo "----------------------"

if [ -f "mcp-server/index.js" ]; then
    echo -e "${GREEN}✓${NC} mcp-server/index.js"
else
    echo -e "${RED}✗${NC} mcp-server/index.js (MISSING)"
    ((ERRORS++))
fi

if [ -f "mcp-server/websocket-server-host.js" ]; then
    echo -e "${GREEN}✓${NC} mcp-server/websocket-server-host.js"
else
    echo -e "${RED}✗${NC} mcp-server/websocket-server-host.js (MISSING)"
    ((ERRORS++))
fi

echo ""
echo "Checking Chrome extension..."
echo "----------------------------"

if [ -f "browser-mcp-extension/manifest.json" ]; then
    echo -e "${GREEN}✓${NC} browser-mcp-extension/manifest.json"
else
    echo -e "${RED}✗${NC} browser-mcp-extension/manifest.json (MISSING)"
    ((ERRORS++))
fi

if [ -f "browser-mcp-extension/background/service-worker.js" ]; then
    echo -e "${GREEN}✓${NC} browser-mcp-extension/background/service-worker.js"
else
    echo -e "${RED}✗${NC} browser-mcp-extension/background/service-worker.js (MISSING)"
    ((ERRORS++))
fi

if [ -f "browser-mcp-extension/background/websocket-client.js" ]; then
    echo -e "${GREEN}✓${NC} browser-mcp-extension/background/websocket-client.js"
else
    echo -e "${RED}✗${NC} browser-mcp-extension/background/websocket-client.js (MISSING)"
    ((ERRORS++))
fi

echo ""
echo "Checking test runner permissions..."
echo "------------------------------------"

if [ -x "tests/run-all-integration-tests.sh" ]; then
    echo -e "${GREEN}✓${NC} tests/run-all-integration-tests.sh (executable)"
else
    echo -e "${YELLOW}⚠${NC} tests/run-all-integration-tests.sh (not executable)"
    echo "  Run: chmod +x tests/run-all-integration-tests.sh"
    ((WARNINGS++))
fi

echo ""
echo "======================================"
echo "Validation Summary"
echo "======================================"
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ Test infrastructure is valid${NC}"
    echo ""
    echo "Ready to run tests:"
    echo "  npm run test:integration:routing"
    echo "  npm run test:integration:reconnection"
    echo "  npm run test:tools:validation"
    echo "  npm run test:performance"
    echo ""
    echo "Or run all tests:"
    echo "  ./tests/run-all-integration-tests.sh"
    exit 0
else
    echo -e "${RED}✗ Test infrastructure has errors${NC}"
    echo "Please fix the errors above before running tests."
    exit 1
fi


