#!/bin/bash

# Test Installation Scripts
# Validates setup scripts work correctly without actually installing

set -e

echo "======================================"
echo "Installation Script Validation"
echo "======================================"
echo ""

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

TESTS_PASSED=0
TESTS_FAILED=0

# Test 1: Check setup-mcp.sh exists and is executable
echo "Test 1: setup-mcp.sh validation"
echo "--------------------------------"

if [ -f "scripts/setup-mcp.sh" ]; then
    echo -e "${GREEN}✓${NC} scripts/setup-mcp.sh exists"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} scripts/setup-mcp.sh missing"
    ((TESTS_FAILED++))
fi

if [ -x "scripts/setup-mcp.sh" ]; then
    echo -e "${GREEN}✓${NC} scripts/setup-mcp.sh is executable"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} scripts/setup-mcp.sh not executable"
    echo "  Run: chmod +x scripts/setup-mcp.sh"
fi

# Test 2: Check install-mcp.sh exists and is executable
echo ""
echo "Test 2: install-mcp.sh validation"
echo "----------------------------------"

if [ -f "scripts/install-mcp.sh" ]; then
    echo -e "${GREEN}✓${NC} scripts/install-mcp.sh exists"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} scripts/install-mcp.sh missing"
    ((TESTS_FAILED++))
fi

if [ -x "scripts/install-mcp.sh" ]; then
    echo -e "${GREEN}✓${NC} scripts/install-mcp.sh is executable"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} scripts/install-mcp.sh not executable"
    echo "  Run: chmod +x scripts/install-mcp.sh"
fi

# Test 3: Check setup-cursor.sh exists and is executable
echo ""
echo "Test 3: setup-cursor.sh validation"
echo "-----------------------------------"

if [ -f "scripts/setup-cursor.sh" ]; then
    echo -e "${GREEN}✓${NC} scripts/setup-cursor.sh exists"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗${NC} scripts/setup-cursor.sh missing"
    ((TESTS_FAILED++))
fi

if [ -x "scripts/setup-cursor.sh" ]; then
    echo -e "${GREEN}✓${NC} scripts/setup-cursor.sh is executable"
    ((TESTS_PASSED++))
else
    echo -e "${YELLOW}⚠${NC} scripts/setup-cursor.sh not executable"
    echo "  Run: chmod +x scripts/setup-cursor.sh"
fi

# Test 4: Validate mcp-server package.json
echo ""
echo "Test 4: mcp-server package validation"
echo "--------------------------------------"

if [ -f "mcp-server/package.json" ]; then
    echo -e "${GREEN}✓${NC} mcp-server/package.json exists"
    
    # Check for required fields
    if grep -q '"name".*"@rvegajr/browser-mcp-server"' mcp-server/package.json; then
        echo -e "${GREEN}✓${NC} Package name is correct"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} Package name incorrect or missing"
        ((TESTS_FAILED++))
    fi
    
    if grep -q '"bin"' mcp-server/package.json; then
        echo -e "${GREEN}✓${NC} bin field exists"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} bin field missing"
        ((TESTS_FAILED++))
    fi
    
    if grep -q '"browser-mcp-server"' mcp-server/package.json; then
        echo -e "${GREEN}✓${NC} browser-mcp-server command defined"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} browser-mcp-server command missing"
        ((TESTS_FAILED++))
    fi
    
else
    echo -e "${RED}✗${NC} mcp-server/package.json missing"
    ((TESTS_FAILED++))
fi

# Test 5: Validate bin file exists
echo ""
echo "Test 5: bin file validation"
echo "----------------------------"

if [ -f "mcp-server/bin/browser-mcp-server" ]; then
    echo -e "${GREEN}✓${NC} mcp-server/bin/browser-mcp-server exists"
    ((TESTS_PASSED++))
    
    if [ -x "mcp-server/bin/browser-mcp-server" ]; then
        echo -e "${GREEN}✓${NC} browser-mcp-server is executable"
        ((TESTS_PASSED++))
    else
        echo -e "${YELLOW}⚠${NC} browser-mcp-server not executable"
        echo "  Run: chmod +x mcp-server/bin/browser-mcp-server"
    fi
    
    # Check shebang
    if head -n 1 mcp-server/bin/browser-mcp-server | grep -q "^#!"; then
        echo -e "${GREEN}✓${NC} Shebang present"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} Shebang missing"
        ((TESTS_FAILED++))
    fi
else
    echo -e "${RED}✗${NC} mcp-server/bin/browser-mcp-server missing"
    ((TESTS_FAILED++))
fi

# Test 6: Validate extension structure
echo ""
echo "Test 6: Extension structure validation"
echo "---------------------------------------"

REQUIRED_FILES=(
    "browser-mcp-extension/manifest.json"
    "browser-mcp-extension/background/service-worker.js"
    "browser-mcp-extension/background/websocket-client.js"
    "browser-mcp-extension/background/mcp-server.js"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} $file missing"
        ((TESTS_FAILED++))
    fi
done

# Test 7: Validate README instructions
echo ""
echo "Test 7: Documentation validation"
echo "---------------------------------"

if [ -f "README.md" ]; then
    echo -e "${GREEN}✓${NC} README.md exists"
    
    if grep -q "npm install -g" README.md; then
        echo -e "${GREEN}✓${NC} Installation instructions present"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} Installation instructions missing"
        ((TESTS_FAILED++))
    fi
    
    if grep -q "chrome://extensions/" README.md; then
        echo -e "${GREEN}✓${NC} Extension setup instructions present"
        ((TESTS_PASSED++))
    else
        echo -e "${RED}✗${NC} Extension setup instructions missing"
        ((TESTS_FAILED++))
    fi
    
else
    echo -e "${RED}✗${NC} README.md missing"
    ((TESTS_FAILED++))
fi

# Summary
echo ""
echo "======================================"
echo "Validation Summary"
echo "======================================"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All installation script validations passed${NC}"
    echo ""
    echo "Installation scripts are ready for testing"
    echo "Note: This validates structure only, not actual installation"
    echo ""
    echo "To test actual installation:"
    echo "  1. Test in clean environment (VM or Docker)"
    echo "  2. Run: ./scripts/setup-mcp.sh --yes"
    echo "  3. Verify: which browser-mcp-server"
    echo "  4. Test: browser-mcp-server"
    exit 0
else
    echo -e "${RED}✗ Some validations failed${NC}"
    echo "Please fix the issues above before testing installation"
    exit 1
fi


