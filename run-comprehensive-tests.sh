#!/bin/bash

# Comprehensive Test Runner for Browser MCP
# Tests the complete MCP flow with real AI assistant integration

set -e

echo "=============================================="
echo "🚀 Browser MCP Comprehensive Test Suite"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test and track results
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    echo -e "${BLUE}🧪 Running: $test_name${NC}"
    echo "Command: $test_command"
    echo ""
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        echo -e "${GREEN}✅ PASSED: $test_name${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${RED}❌ FAILED: $test_name${NC}"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    
    echo ""
    echo "----------------------------------------------"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}🔍 Checking prerequisites...${NC}"
    
    # Check if Node.js is installed
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    # Check if Playwright is installed
    if ! npm list @playwright/test &> /dev/null; then
        echo -e "${YELLOW}⚠️  Playwright not found, installing...${NC}"
        npm install @playwright/test
    fi
    
    # Check if Chrome is available
    if ! command -v google-chrome &> /dev/null && ! command -v chromium &> /dev/null; then
        echo -e "${YELLOW}⚠️  Chrome/Chromium not found in PATH${NC}"
        echo "   Tests will use Playwright's bundled browser"
    fi
    
    echo -e "${GREEN}✅ Prerequisites check complete${NC}"
    echo ""
}

# Function to start MCP server in background
start_mcp_server() {
    echo -e "${YELLOW}🚀 Starting MCP Server in background...${NC}"
    
    # Kill any existing MCP server
    pkill -f "node.*mcp-server" || true
    
    # Start MCP server
    cd mcp-server
    nohup node index.js > /tmp/mcp-server-test.log 2>&1 &
    MCP_PID=$!
    cd ..
    
    # Wait for server to start
    echo "Waiting for MCP server to start..."
    for i in {1..10}; do
        if curl -s http://localhost:8765/health > /dev/null 2>&1; then
            echo -e "${GREEN}✅ MCP Server started successfully${NC}"
            return 0
        fi
        sleep 1
    done
    
    echo -e "${RED}❌ MCP Server failed to start${NC}"
    echo "Check /tmp/mcp-server-test.log for details"
    return 1
}

# Function to stop MCP server
stop_mcp_server() {
    echo -e "${YELLOW}🛑 Stopping MCP Server...${NC}"
    if [ ! -z "$MCP_PID" ]; then
        kill $MCP_PID 2>/dev/null || true
    fi
    pkill -f "node.*mcp-server" || true
    echo -e "${GREEN}✅ MCP Server stopped${NC}"
}

# Function to cleanup
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    stop_mcp_server
    
    # Clean up test artifacts
    rm -rf browser-mcp-extension/tests/.playwright-*
    rm -f /tmp/mcp-server-test.log
    
    echo -e "${GREEN}✅ Cleanup complete${NC}"
}

# Trap to ensure cleanup on exit
trap cleanup EXIT

# Main test execution
main() {
    echo -e "${BLUE}🎯 Test Plan:${NC}"
    echo "1. Unit Tests - Core functionality"
    echo "2. Basic E2E Tests - Extension loading"
    echo "3. Integration Tests - Extension + Chrome APIs"
    echo "4. MCP Full Stack Tests - Complete MCP flow"
    echo "5. AI Assistant Tests - Real AI integration"
    echo "6. IDE Compatibility Tests - Cross-IDE support"
    echo ""
    
    # Check prerequisites
    check_prerequisites
    
    # Start MCP server
    if ! start_mcp_server; then
        echo -e "${RED}❌ Cannot proceed without MCP server${NC}"
        exit 1
    fi
    
    # Run test suites
    echo -e "${BLUE}📋 Running Test Suites...${NC}"
    echo ""
    
    # 1. Unit Tests
    run_test "Unit Tests" "npm run test:unit"
    
    # 2. Basic E2E Tests
    run_test "Basic E2E Tests" "npm run test:e2e"
    
    # 3. Integration Tests
    run_test "Integration Tests" "npm run test:integration"
    
    # 4. MCP Full Stack Tests
    run_test "MCP Full Stack Tests" "npm run test:mcp"
    
    # 5. AI Assistant Tests
    run_test "AI Assistant Integration Tests" "npm run test:ai"
    
    # 6. IDE Compatibility Tests
    run_test "IDE Compatibility Tests" "npm run test:ide"
    
    # Print final results
    echo "=============================================="
    echo -e "${BLUE}📊 TEST RESULTS SUMMARY${NC}"
    echo "=============================================="
    echo -e "Total Tests: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "Passed: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "Failed: ${RED}$FAILED_TESTS${NC}"
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
        echo -e "${GREEN}✅ Browser MCP is ready for production use${NC}"
        echo -e "${GREEN}✅ Compatible with all major IDEs${NC}"
        echo -e "${GREEN}✅ Full AI assistant integration verified${NC}"
        exit 0
    else
        echo -e "${RED}❌ $FAILED_TESTS test(s) failed${NC}"
        echo -e "${YELLOW}⚠️  Please review the failed tests above${NC}"
        exit 1
    fi
}

# Run main function
main "$@"
