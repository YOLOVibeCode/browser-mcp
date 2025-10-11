#!/bin/bash

# Run All Integration Tests
# Executes the complete test suite for Browser MCP

set -e

echo "======================================"
echo "Browser MCP - Integration Test Suite"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Test results
PASSED=0
FAILED=0
SKIPPED=0

echo "Prerequisites Check"
echo "-------------------"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "${GREEN}✓${NC} Node.js: $NODE_VERSION"
else
    echo "${RED}✗${NC} Node.js not found"
    exit 1
fi

# Check npm packages
if [ -f "node_modules/.package-lock.json" ]; then
    echo "${GREEN}✓${NC} npm packages installed"
else
    echo "${YELLOW}⚠${NC} Running npm install..."
    npm install
fi

# Check Playwright browsers
if [ -d "$HOME/.cache/ms-playwright" ]; then
    echo "${GREEN}✓${NC} Playwright browsers installed"
else
    echo "${YELLOW}⚠${NC} Installing Playwright browsers..."
    npx playwright install chromium
fi

echo ""
echo "Test Execution"
echo "--------------"

# Phase 1: Unit Tests
echo ""
echo "Phase 1: Unit Tests"
echo "-------------------"
if npm run test:unit; then
    echo "${GREEN}✓ Unit tests passed${NC}"
    ((PASSED++))
else
    echo "${RED}✗ Unit tests failed${NC}"
    ((FAILED++))
fi

# Phase 2: Component Tests (E2E)
echo ""
echo "Phase 2: Component Tests (E2E)"
echo "-------------------------------"
if npm run test:e2e; then
    echo "${GREEN}✓ Component tests passed${NC}"
    ((PASSED++))
else
    echo "${RED}✗ Component tests failed${NC}"
    ((FAILED++))
fi

# Phase 3: Integration Tests - Message Routing
echo ""
echo "Phase 3: Integration - Message Routing"
echo "---------------------------------------"
if npm run test:integration:routing; then
    echo "${GREEN}✓ Message routing tests passed${NC}"
    ((PASSED++))
else
    echo "${RED}✗ Message routing tests failed${NC}"
    ((FAILED++))
fi

# Phase 4: Integration Tests - Reconnection
echo ""
echo "Phase 4: Integration - Reconnection Logic"
echo "------------------------------------------"
if npm run test:integration:reconnection; then
    echo "${GREEN}✓ Reconnection tests passed${NC}"
    ((PASSED++))
else
    echo "${RED}✗ Reconnection tests failed${NC}"
    ((FAILED++))
fi

# Phase 5: Tool Validation (This takes longer)
echo ""
echo "Phase 5: Tool Validation (33 tools)"
echo "------------------------------------"
echo "${YELLOW}Note: This phase may take several minutes${NC}"

if npm run test:tools:validation; then
    echo "${GREEN}✓ Tool validation passed${NC}"
    ((PASSED++))
else
    echo "${RED}✗ Tool validation failed${NC}"
    ((FAILED++))
fi

# Summary
echo ""
echo "======================================"
echo "Test Suite Summary"
echo "======================================"
echo "Passed:  ${GREEN}$PASSED${NC}"
echo "Failed:  ${RED}$FAILED${NC}"
echo "Skipped: ${YELLOW}$SKIPPED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo "${GREEN}✓ ALL TESTS PASSED${NC}"
    echo ""
    echo "Production Readiness: ✓ READY"
    exit 0
else
    echo "${RED}✗ SOME TESTS FAILED${NC}"
    echo ""
    echo "Production Readiness: ✗ NOT READY"
    exit 1
fi


