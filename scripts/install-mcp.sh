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
read -p "Enter choice (1-3): " IDE_CHOICE
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
    echo "✓ Companion app started (PID: $COMPANION_PID)"
    echo "  Log: /tmp/browser-mcp-companion.log"

    # Wait for it to start
    sleep 2

    # Verify it's running
    if curl -s http://localhost:3100/health > /dev/null 2>&1; then
        echo "✓ Companion app is healthy"
    else
        echo "⚠️  Companion app may not be running. Check logs: /tmp/browser-mcp-companion.log"
    fi
else
    echo "❌ Error: browser-mcp-companion command not found"
    echo "   Try running: npm install -g browser-mcp-companion"
fi
echo ""

# Final instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Installation Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Next Steps:"
echo ""

if [ "$IDE_CHOICE" = "1" ] || [ "$IDE_CHOICE" = "3" ]; then
    echo "1. Restart Claude Desktop (Quit completely and reopen)"
fi

if [ "$IDE_CHOICE" = "2" ] || [ "$IDE_CHOICE" = "3" ]; then
    echo "2. Restart Cursor IDE (Quit completely and reopen)"
fi

echo ""
echo "3. Install the Chrome extension from:"
echo "   https://github.com/YOLOVibeCode/browser-mcp"
echo "   • Clone or download the repository"
echo "   • Open chrome://extensions/"
echo "   • Enable 'Developer mode'"
echo "   • Click 'Load unpacked'"
echo "   • Select the extension-chromium/dist folder"
echo ""
echo "4. The companion app is already running!"
echo "   • URL: http://localhost:3100"
echo "   • Logs: /tmp/browser-mcp-companion.log"
echo "   • To stop: kill $COMPANION_PID"
echo ""
echo "5. Connect a browser tab and start using Browser MCP!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✨ Your AI assistant now has browser inspection powers!"
echo ""
