#!/bin/bash

# Browser MCP Server Startup Script
# This script ensures clean startup by stopping any existing MCP server processes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MCP_SERVER_DIR="/Users/xcode/Documents/YOLOProjects/browser-mcp/mcp-server"
DEFAULT_PORT=8765
HEALTH_PORT=8766

echo -e "${BLUE}🚀 Browser MCP Server Startup Script${NC}"
echo "================================================"

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to find and kill MCP server processes
kill_existing_servers() {
    echo -e "${YELLOW}🔍 Checking for existing MCP server processes...${NC}"
    
    # Find processes running browser-mcp-server or node index.js in mcp-server directory
    local pids=$(pgrep -f "browser-mcp-server\|node.*mcp-server.*index\.js" 2>/dev/null || true)
    
    if [ -n "$pids" ]; then
        echo -e "${YELLOW}⚠️  Found existing MCP server processes: $pids${NC}"
        echo -e "${YELLOW}🛑 Stopping existing processes...${NC}"
        
        # Try graceful shutdown first
        for pid in $pids; do
            if kill -TERM $pid 2>/dev/null; then
                echo -e "${YELLOW}   Sent TERM signal to PID $pid${NC}"
            fi
        done
        
        # Wait a moment for graceful shutdown
        sleep 2
        
        # Check if processes are still running and force kill if necessary
        local remaining_pids=$(pgrep -f "browser-mcp-server\|node.*mcp-server.*index\.js" 2>/dev/null || true)
        if [ -n "$remaining_pids" ]; then
            echo -e "${RED}⚠️  Some processes still running, force killing...${NC}"
            for pid in $remaining_pids; do
                if kill -KILL $pid 2>/dev/null; then
                    echo -e "${RED}   Force killed PID $pid${NC}"
                fi
            done
        fi
        
        echo -e "${GREEN}✅ Existing processes stopped${NC}"
    else
        echo -e "${GREEN}✅ No existing MCP server processes found${NC}"
    fi
}

# Function to check and wait for ports to be free
wait_for_ports() {
    local max_wait=10
    local wait_count=0
    
    echo -e "${YELLOW}🔍 Checking if ports are available...${NC}"
    
    while [ $wait_count -lt $max_wait ]; do
        if check_port $DEFAULT_PORT; then
            echo -e "${YELLOW}   Port $DEFAULT_PORT is still in use, waiting...${NC}"
            sleep 1
            wait_count=$((wait_count + 1))
        else
            break
        fi
    done
    
    if check_port $DEFAULT_PORT; then
        echo -e "${RED}❌ Port $DEFAULT_PORT is still in use after $max_wait seconds${NC}"
        echo -e "${RED}   You may need to manually stop the process using this port${NC}"
        echo -e "${RED}   Run: lsof -ti:$DEFAULT_PORT | xargs kill -9${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Ports are available${NC}"
}

# Function to start the MCP server
start_mcp_server() {
    echo -e "${BLUE}🚀 Starting Browser MCP Server...${NC}"
    
    cd "$MCP_SERVER_DIR"
    
    if [ ! -f "index.js" ]; then
        echo -e "${RED}❌ MCP server index.js not found in $MCP_SERVER_DIR${NC}"
        exit 1
    fi
    
    # Start the server in background with stdin connected to /dev/null to prevent immediate exit
    nohup node index.js < /dev/null > mcp-server.log 2>&1 &
    local server_pid=$!
    
    echo -e "${GREEN}✅ MCP Server started with PID: $server_pid${NC}"
    echo -e "${BLUE}📝 Logs are being written to: $MCP_SERVER_DIR/mcp-server.log${NC}"
    
    # Wait a moment for server to start
    sleep 3
    
    # Check if server is still running
    if kill -0 $server_pid 2>/dev/null; then
        echo -e "${GREEN}✅ MCP Server is running successfully${NC}"
        
        # Try to check health endpoint
        local health_port=$HEALTH_PORT
        while [ $health_port -lt $((HEALTH_PORT + 10)) ]; do
            if curl -s "http://localhost:$health_port/health" >/dev/null 2>&1; then
                echo -e "${GREEN}✅ Health endpoint available at http://localhost:$health_port/health${NC}"
                break
            fi
            health_port=$((health_port + 1))
        done
        
        echo -e "${BLUE}🌐 WebSocket server should be available at ws://localhost:$DEFAULT_PORT${NC}"
        echo -e "${BLUE}📋 To stop the server, run: kill $server_pid${NC}"
        echo -e "${BLUE}📋 To view logs, run: tail -f $MCP_SERVER_DIR/mcp-server.log${NC}"
        
    else
        echo -e "${RED}❌ MCP Server failed to start${NC}"
        echo -e "${RED}📝 Check logs: cat $MCP_SERVER_DIR/mcp-server.log${NC}"
        exit 1
    fi
}

# Main execution
main() {
    # Check if we're in the right directory
    if [ ! -d "$MCP_SERVER_DIR" ]; then
        echo -e "${RED}❌ MCP server directory not found: $MCP_SERVER_DIR${NC}"
        exit 1
    fi
    
    # Kill existing servers
    kill_existing_servers
    
    # Wait for ports to be free
    wait_for_ports
    
    # Start the server
    start_mcp_server
    
    echo -e "${GREEN}🎉 Browser MCP Server startup complete!${NC}"
}

# Run main function
main "$@"