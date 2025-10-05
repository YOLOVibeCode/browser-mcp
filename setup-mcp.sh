#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║        Browser MCP - Automatic Setup Utility              ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Get absolute project path
PROJECT_PATH=$(cd "$(dirname "$0")" && pwd)
echo -e "${BLUE}📍 Project location:${NC} $PROJECT_PATH"
echo ""

# Detect OS
OS=$(uname -s)
case "$OS" in
    Darwin)
        OS_NAME="macOS"
        CLAUDE_CONFIG_DIR="$HOME/Library/Application Support/Claude"
        CURSOR_CONFIG_DIR="$HOME/.cursor"
        WINDSURF_CONFIG_DIR="$HOME/.codeium/windsurf"
        ;;
    Linux)
        OS_NAME="Linux"
        CLAUDE_CONFIG_DIR="$HOME/.config/Claude"
        CURSOR_CONFIG_DIR="$HOME/.cursor"
        WINDSURF_CONFIG_DIR="$HOME/.codeium/windsurf"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        OS_NAME="Windows"
        CLAUDE_CONFIG_DIR="$APPDATA/Claude"
        CURSOR_CONFIG_DIR="$APPDATA/Cursor"
        WINDSURF_CONFIG_DIR="$APPDATA/Codeium/windsurf"
        ;;
    *)
        OS_NAME="Unknown"
        ;;
esac

echo -e "${BLUE}💻 Operating System:${NC} $OS_NAME"
echo ""

# Function to create MCP config
create_mcp_config() {
    local config_file=$1
    cat > "$config_file" << EOFCONFIG
{
  "mcpServers": {
    "browser-inspector": {
      "command": "node",
      "args": [
        "$PROJECT_PATH/mcp-server/dist/index.js"
      ],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
EOFCONFIG
}

# Function to backup existing config
backup_config() {
    local config_file=$1
    if [ -f "$config_file" ]; then
        local backup_file="${config_file}.backup.$(date +%Y%m%d_%H%M%S)"
        cp "$config_file" "$backup_file"
        echo -e "   ${YELLOW}📦 Backed up existing config to:${NC}"
        echo "      $backup_file"
    fi
}

# Function to merge with existing config
merge_config() {
    local config_file=$1
    local temp_file="${config_file}.tmp"

    if [ -f "$config_file" ]; then
        # Check if browser-inspector already exists
        if grep -q "browser-inspector" "$config_file"; then
            echo -e "   ${YELLOW}⚠️  browser-inspector already exists in config${NC}"
            echo -n "      Overwrite? (y/n): "
            read -r response
            if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
                echo "      Skipped."
                return 1
            fi
        fi

        # Merge configs using Python
        python3 << EOFPYTHON
import json
import sys

try:
    with open("$config_file", "r") as f:
        existing = json.load(f)

    new_server = {
        "browser-inspector": {
            "command": "node",
            "args": ["$PROJECT_PATH/mcp-server/dist/index.js"],
            "env": {"NODE_ENV": "production"}
        }
    }

    if "mcpServers" not in existing:
        existing["mcpServers"] = {}

    existing["mcpServers"]["browser-inspector"] = new_server["browser-inspector"]

    with open("$temp_file", "w") as f:
        json.dump(existing, f, indent=2)

    print("Merged successfully")
except Exception as e:
    print(f"Error: {e}")
    sys.exit(1)
EOFPYTHON

        if [ $? -eq 0 ] && [ -f "$temp_file" ]; then
            mv "$temp_file" "$config_file"
            return 0
        else
            echo -e "   ${RED}❌ Failed to merge configs${NC}"
            return 1
        fi
    else
        # No existing config, create new
        create_mcp_config "$config_file"
        return 0
    fi
}

# Build check
echo -e "${GREEN}▶ Step 1: Checking Build${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ ! -f "$PROJECT_PATH/mcp-server/dist/index.js" ]; then
    echo -e "${YELLOW}⚠️  MCP server not built${NC}"
    echo ""
    echo -n "Build now? (y/n): "
    read -r response

    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        echo ""
        echo "Building..."
        cd "$PROJECT_PATH"
        npm run build

        if [ $? -ne 0 ]; then
            echo -e "${RED}❌ Build failed${NC}"
            exit 1
        fi
        echo -e "${GREEN}✅ Build complete${NC}"
    else
        echo -e "${RED}❌ MCP server must be built first${NC}"
        echo "   Run: npm run build"
        exit 1
    fi
else
    echo -e "   ${GREEN}✅ MCP server is built${NC}"
fi
echo ""

# Test server
echo -e "${GREEN}▶ Step 2: Testing MCP Server${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

RESPONSE=$(echo '{"jsonrpc":"2.0","id":1,"method":"initialize"}' | timeout 2 node "$PROJECT_PATH/mcp-server/dist/index.js" 2>/dev/null)

if echo "$RESPONSE" | grep -q "Browser MCP Server"; then
    echo -e "   ${GREEN}✅ Server responds correctly${NC}"
else
    echo -e "   ${YELLOW}⚠️  Server response unclear (may still work)${NC}"
fi
echo ""

# Detect IDEs
echo -e "${GREEN}▶ Step 3: Detecting IDEs${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FOUND_IDES=()

# Check for Claude Desktop
if [ -d "/Applications/Claude.app" ] || command -v claude &> /dev/null; then
    FOUND_IDES+=("claude")
    echo -e "   ${GREEN}✅ Claude Desktop detected${NC}"
else
    echo -e "   ${YELLOW}⚠️  Claude Desktop not found${NC}"
fi

# Check for Cursor
if [ -d "/Applications/Cursor.app" ] || command -v cursor &> /dev/null; then
    FOUND_IDES+=("cursor")
    echo -e "   ${GREEN}✅ Cursor IDE detected${NC}"
else
    echo -e "   ${YELLOW}⚠️  Cursor IDE not found${NC}"
fi

# Check for Windsurf
if [ -d "/Applications/Windsurf.app" ] || command -v windsurf &> /dev/null; then
    FOUND_IDES+=("windsurf")
    echo -e "   ${GREEN}✅ Windsurf IDE detected${NC}"
else
    echo -e "   ${YELLOW}⚠️  Windsurf IDE not found${NC}"
fi

if [ ${#FOUND_IDES[@]} -eq 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  No supported IDEs detected${NC}"
    echo ""
    echo "You can still configure manually:"
    echo "  • Claude Desktop config: $CLAUDE_CONFIG_DIR/claude_desktop_config.json"
    echo "  • Cursor IDE config: $CURSOR_CONFIG_DIR/mcp.json"
    echo "  • Windsurf IDE config: $WINDSURF_CONFIG_DIR/mcp_config.json"
    echo ""
    echo "Or install:"
    echo "  • Claude Desktop: https://claude.ai/download"
    echo "  • Cursor IDE: https://cursor.sh"
    echo "  • Windsurf IDE: https://codeium.com/windsurf"
    exit 0
fi
echo ""

# Setup for each IDE
for IDE in "${FOUND_IDES[@]}"; do
    case "$IDE" in
        claude)
            echo -e "${GREEN}▶ Step 4a: Configuring Claude Desktop${NC}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

            # Create directory
            mkdir -p "$CLAUDE_CONFIG_DIR"
            echo -e "   ${GREEN}✅ Created config directory${NC}"

            CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

            # Backup if exists
            if [ -f "$CLAUDE_CONFIG_FILE" ]; then
                backup_config "$CLAUDE_CONFIG_FILE"
            fi

            # Merge or create config
            if merge_config "$CLAUDE_CONFIG_FILE"; then
                echo -e "   ${GREEN}✅ Claude Desktop configured${NC}"
                echo "      Config: $CLAUDE_CONFIG_FILE"
            else
                echo -e "   ${YELLOW}⚠️  Claude Desktop configuration skipped${NC}"
            fi
            echo ""
            ;;

        cursor)
            echo -e "${GREEN}▶ Step 4b: Configuring Cursor IDE${NC}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

            # Create directory
            mkdir -p "$CURSOR_CONFIG_DIR"
            echo -e "   ${GREEN}✅ Created config directory${NC}"

            CURSOR_CONFIG_FILE="$CURSOR_CONFIG_DIR/mcp.json"

            # Backup if exists
            if [ -f "$CURSOR_CONFIG_FILE" ]; then
                backup_config "$CURSOR_CONFIG_FILE"
            fi

            # Merge or create config
            if merge_config "$CURSOR_CONFIG_FILE"; then
                echo -e "   ${GREEN}✅ Cursor IDE configured${NC}"
                echo "      Config: $CURSOR_CONFIG_FILE"
            else
                echo -e "   ${YELLOW}⚠️  Cursor IDE configuration skipped${NC}"
            fi
            echo ""
            ;;

        windsurf)
            echo -e "${GREEN}▶ Step 4c: Configuring Windsurf IDE${NC}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

            # Create directory
            mkdir -p "$WINDSURF_CONFIG_DIR"
            echo -e "   ${GREEN}✅ Created config directory${NC}"

            WINDSURF_CONFIG_FILE="$WINDSURF_CONFIG_DIR/mcp_config.json"

            # Backup if exists
            if [ -f "$WINDSURF_CONFIG_FILE" ]; then
                backup_config "$WINDSURF_CONFIG_FILE"
            fi

            # Merge or create config
            if merge_config "$WINDSURF_CONFIG_FILE"; then
                echo -e "   ${GREEN}✅ Windsurf IDE configured${NC}"
                echo "      Config: $WINDSURF_CONFIG_FILE"
            else
                echo -e "   ${YELLOW}⚠️  Windsurf IDE configuration skipped${NC}"
            fi
            echo ""
            ;;
    esac
done

# Load Chrome Extension
echo -e "${GREEN}▶ Step 5: Chrome Extension${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ -d "$PROJECT_PATH/extension-chromium/dist" ]; then
    echo -e "   ${GREEN}✅ Extension is built${NC}"
    echo ""
    echo "   To load in Chrome:"
    echo "   1. Open: chrome://extensions/"
    echo "   2. Enable 'Developer mode'"
    echo "   3. Click 'Load unpacked'"
    echo "   4. Select: $PROJECT_PATH/extension-chromium/dist/"
else
    echo -e "   ${RED}❌ Extension not built${NC}"
    echo "   Run: npm run build"
fi
echo ""

# Summary
echo ""
echo -e "${BLUE}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                                                            ║"
echo "║                   🎉 Setup Complete! 🎉                    ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo -e "${GREEN}✅ Configuration Summary:${NC}"
echo ""

for IDE in "${FOUND_IDES[@]}"; do
    case "$IDE" in
        claude)
            echo "  📦 Claude Desktop:"
            echo "     Config: $CLAUDE_CONFIG_DIR/claude_desktop_config.json"
            echo "     Status: Configured ✅"
            echo ""
            ;;
        cursor)
            echo "  📦 Cursor IDE:"
            echo "     Config: $CURSOR_CONFIG_DIR/mcp.json"
            echo "     Status: Configured ✅"
            echo ""
            ;;
        windsurf)
            echo "  📦 Windsurf IDE:"
            echo "     Config: $WINDSURF_CONFIG_DIR/mcp_config.json"
            echo "     Status: Configured ✅"
            echo ""
            ;;
    esac
done

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""

step=1
for IDE in "${FOUND_IDES[@]}"; do
    case "$IDE" in
        claude)
            echo "  ${step}. Restart Claude Desktop (Quit completely, then reopen)"
            ((step++))
            ;;
        cursor)
            echo "  ${step}. Restart Cursor IDE (Cmd+Q, then reopen)"
            ((step++))
            ;;
        windsurf)
            echo "  ${step}. Restart Windsurf IDE (Cmd+Q, then reopen)"
            ((step++))
            ;;
    esac
done

echo "  ${step}. Load Chrome extension:"
echo "     • chrome://extensions/"
echo "     • Load unpacked: extension-chromium/dist/"
((step++))

echo "  ${step}. Test in your IDE:"
echo "     Ask: 'What MCP servers are available?'"
echo "     Expected: 'browser-inspector'"
echo ""

echo -e "${GREEN}📚 Documentation:${NC}"
echo "  • Quick Start: QUICKSTART.md"
echo "  • Cursor Guide: CURSOR_INTEGRATION.md"
echo "  • Testing: TESTING.md"
echo ""

echo -e "${GREEN}🧪 Test Commands:${NC}"
echo "  ./test-quick.sh      # Quick system test"
echo "  ./demo.sh            # Interactive demo"
echo "  npm test -- --run    # Full test suite"
echo ""

echo -e "${BLUE}✨ Ready to expose browser state to AI! ✨${NC}"
echo ""
