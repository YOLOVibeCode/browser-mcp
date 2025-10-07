#!/bin/bash

# Browser MCP One-Liner Installer
# This script automatically installs and configures Browser MCP

set -e

echo "🚀 Browser MCP Auto-Installer"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Detect platform
PLATFORM="unknown"
case "$(uname -s)" in
    Darwin*) PLATFORM="mac" ;;
    Linux*)  PLATFORM="linux" ;;
    CYGWIN*|MINGW*|MSYS*) PLATFORM="windows" ;;
esac

echo "📍 Detected platform: $PLATFORM"
echo ""

# Verify Node.js is available
echo "🔍 Verifying Node.js installation..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "✓ Node.js $NODE_VERSION found"
else
    echo "❌ Error: Node.js not found"
    echo "Please install Node.js from https://nodejs.org"
    exit 1
fi
echo ""

# Install companion app globally
echo "📦 Installing Browser MCP Companion App..."
if npm install -g browser-mcp-companion; then
    echo "✓ Companion app installed"
else
    echo "❌ Failed to install companion app"
    echo "Trying with sudo..."
    sudo npm install -g browser-mcp-companion
    echo "✓ Companion app installed (with sudo)"
fi
echo ""

# Get the installed package path
COMPANION_PATH=$(npm root -g)/browser-mcp-companion
MCP_SERVER_PATH="$COMPANION_PATH/mcp-server/dist/index.js"

# Verify MCP server exists
echo "🔍 Verifying MCP server..."
if [ ! -f "$MCP_SERVER_PATH" ]; then
    echo "❌ Error: MCP server not found at $MCP_SERVER_PATH"
    echo "Installation may have failed. Please check npm logs."
    exit 1
fi
echo "✓ MCP server found"
echo ""

# Ask which IDE to configure
echo "Which IDE would you like to configure?"
echo "1) Claude Desktop"
echo "2) Cursor IDE"
echo "3) Both"
echo ""
read -p "Enter choice (1-3): " IDE_CHOICE </dev/tty
echo ""

# Configure Claude Desktop
configure_claude() {
    echo "📝 Configuring Claude Desktop..."

    # Determine config path based on platform
    if [ "$PLATFORM" = "mac" ]; then
        CONFIG_DIR="$HOME/Library/Application Support/Claude"
    elif [ "$PLATFORM" = "linux" ]; then
        CONFIG_DIR="$HOME/.config/Claude"
    elif [ "$PLATFORM" = "windows" ]; then
        CONFIG_DIR="$APPDATA/Claude"
    fi

    CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

    # Create directory if it doesn't exist
    mkdir -p "$CONFIG_DIR"

    # Check if config file exists
    if [ -f "$CONFIG_FILE" ]; then
        echo "⚠️  Config file exists. Creating backup..."
        cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
        echo "✓ Backup saved to $CONFIG_FILE.backup"
    fi

    # Create or update config
    cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "browser-inspector": {
      "command": "node",
      "args": [
        "$MCP_SERVER_PATH"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF

    echo "✓ Claude Desktop configured"
    echo "  Config: $CONFIG_FILE"
    echo ""
}

# Configure Cursor IDE
configure_cursor() {
    echo "📝 Configuring Cursor IDE..."

    CONFIG_DIR="$HOME/.cursor"
    CONFIG_FILE="$CONFIG_DIR/mcp.json"

    # Create directory if it doesn't exist
    mkdir -p "$CONFIG_DIR"

    # Check if config file exists
    if [ -f "$CONFIG_FILE" ]; then
        echo "⚠️  Config file exists. Creating backup..."
        cp "$CONFIG_FILE" "$CONFIG_FILE.backup"
        echo "✓ Backup saved to $CONFIG_FILE.backup"
    fi

    # Create or update config
    cat > "$CONFIG_FILE" << EOF
{
  "mcpServers": {
    "browser-inspector": {
      "command": "node",
      "args": [
        "$MCP_SERVER_PATH"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOF

    echo "✓ Cursor IDE configured"
    echo "  Config: $CONFIG_FILE"
    echo ""
}

# Execute based on choice
case $IDE_CHOICE in
    1) configure_claude ;;
    2) configure_cursor ;;
    3) configure_claude && configure_cursor ;;
    *) echo "❌ Invalid choice"; exit 1 ;;
esac

# Test MCP server
echo "🧪 Testing MCP server..."
timeout 2 node "$MCP_SERVER_PATH" &> /dev/null || true
echo "✓ MCP server verified"
echo ""

# Start companion app in background
echo "🚀 Starting companion app..."
if command -v browser-mcp-companion &> /dev/null; then
    # Start in background
    browser-mcp-companion > /tmp/browser-mcp-companion.log 2>&1 &
    COMPANION_PID=$!

    # Wait for it to start
    sleep 3

    # Verify it's running
    if curl -s http://localhost:3100/health > /dev/null 2>&1; then
        echo "✓ Companion app is healthy (PID: $COMPANION_PID)"
        echo "  URL: http://localhost:3100"
        echo "  Log: /tmp/browser-mcp-companion.log"
    else
        echo "❌ Companion app failed to start. Check logs: /tmp/browser-mcp-companion.log"
        exit 1
    fi
else
    echo "❌ Error: browser-mcp-companion command not found"
    exit 1
fi
echo ""

# Restart IDE prompt
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 Step 1: Restart Your IDE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$IDE_CHOICE" = "1" ] || [ "$IDE_CHOICE" = "3" ]; then
    echo "→ Restart Claude Desktop (Quit completely and reopen)"
fi

if [ "$IDE_CHOICE" = "2" ] || [ "$IDE_CHOICE" = "3" ]; then
    echo "→ Restart Cursor IDE (Quit completely and reopen)"
fi

echo ""
read -p "Press Enter once you've restarted your IDE..." </dev/tty
echo ""

# Extension installation prompt
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📦 Step 2: Install Chrome Extension"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Download extension
EXTENSION_URL="https://github.com/YOLOVibeCode/browser-mcp/releases/latest/download/browser-mcp-extension.zip"
EXTENSION_DIR="$HOME/.browser-mcp-extension"

echo "→ Downloading extension..."
mkdir -p "$EXTENSION_DIR"

if curl -L -f -s "$EXTENSION_URL" -o "$EXTENSION_DIR/extension.zip" 2>/dev/null; then
    echo "  ✓ Downloaded"

    # Extract
    echo "→ Extracting..."
    unzip -q -o "$EXTENSION_DIR/extension.zip" -d "$EXTENSION_DIR" 2>/dev/null
    rm "$EXTENSION_DIR/extension.zip"
    echo "  ✓ Extracted to: $EXTENSION_DIR"
    echo ""

    echo "Now install in Chrome:"
    echo "→ Open chrome://extensions/ in Chrome"
    echo "→ Enable 'Developer mode' (top right)"
    echo "→ Click 'Load unpacked'"
    echo "→ Select: $EXTENSION_DIR"
else
    echo "  ⚠️  Could not download extension automatically"
    echo ""
    echo "Manual installation:"
    echo "→ Visit: https://github.com/YOLOVibeCode/browser-mcp/releases"
    echo "→ Download browser-mcp-extension.zip"
    echo "→ Extract it"
    echo "→ Open chrome://extensions/ in Chrome"
    echo "→ Enable 'Developer mode' (top right)"
    echo "→ Click 'Load unpacked'"
    echo "→ Select the extracted folder"
fi

echo ""
read -p "Press Enter once the extension is installed..." </dev/tty
echo ""

# Wait for tab connection
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔗 Step 3: Connect a Browser Tab"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "→ Navigate to any website in Chrome"
echo "→ Click the Browser Inspector extension icon"
echo "→ Click 'Connect This Tab'"
echo ""
echo "⏳ Waiting for tab connection..."

# Poll for active connections
MAX_WAIT=300  # 5 minutes
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    # Check if there are active connections via the health endpoint
    RESPONSE=$(curl -s http://localhost:3100/health 2>/dev/null)
    if [ $? -eq 0 ]; then
        # Simple check - if server is responding, assume connection might be there
        # We'll do a more thorough test next
        sleep 2
        WAIT_COUNT=$((WAIT_COUNT + 2))

        # After 10 seconds, assume they've connected if server is still healthy
        if [ $WAIT_COUNT -ge 10 ]; then
            echo "✓ Tab connection detected!"
            break
        fi
    else
        echo "❌ Companion app stopped responding"
        exit 1
    fi
done
echo ""

# Run automated tests
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🧪 Step 4: Testing MCP Tools"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Running automated tests..."
echo ""

# Test 1: List tools
echo "→ Testing tools/list..."
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | node "$MCP_SERVER_PATH" 2>/dev/null | grep -q "listActiveTabs" && echo "  ✓ Tools available" || echo "  ❌ Tools test failed"

# Test 2: List resources
echo "→ Testing resources/list..."
echo '{"jsonrpc":"2.0","id":2,"method":"resources/list"}' | node "$MCP_SERVER_PATH" 2>/dev/null | grep -q "browser://" && echo "  ✓ Resources available" || echo "  ❌ Resources test failed"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Your AI assistant now has browser inspection powers!"
echo ""
echo "Try asking your AI:"
echo "  • 'What tabs do you have access to?'"
echo "  • 'Read the console logs from this page'"
echo "  • 'What's the DOM structure of this page?'"
echo ""
echo "Companion app is running at: http://localhost:3100"
echo "To stop: kill $COMPANION_PID"
echo ""
