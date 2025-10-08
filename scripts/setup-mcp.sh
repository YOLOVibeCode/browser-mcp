#!/bin/bash

# Parse command line arguments
AUTO_ACCEPT=false
SHOW_HELP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --yes|-y)
            AUTO_ACCEPT=true
            shift
            ;;
        --help|-h)
            SHOW_HELP=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Show help
if [ "$SHOW_HELP" = true ]; then
    cat << 'EOF'
Browser MCP Setup - Bash Installer

Usage:
  ./setup-mcp.sh [options]

Options:
  --yes, -y    Auto-accept all prompts (non-interactive mode)
  --help, -h   Show this help message

Examples:
  ./setup-mcp.sh              # Interactive install
  ./setup-mcp.sh --yes        # Auto-install without prompts

Or run remotely:
  curl -fsSL https://raw.githubusercontent.com/YOLOVibeCode/browser-mcp/main/scripts/setup-mcp.sh | bash
  curl -fsSL https://raw.githubusercontent.com/YOLOVibeCode/browser-mcp/main/scripts/setup-mcp.sh | bash -s -- --yes

EOF
    exit 0
fi

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
echo "║                      v4.0.0                                ║"
echo "║              WebSocket Architecture                        ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

if [ "$AUTO_ACCEPT" = true ]; then
    echo -e "${YELLOW}⚙️  Running in auto-accept mode (--yes)${NC}"
    echo ""
fi

# Detect if we're running from curl | bash
if [ "$0" = "bash" ]; then
    echo -e "${YELLOW}⚠️  Running from curl | bash - cloning repository first...${NC}"
    echo ""

    # Clone to temp directory
    TEMP_DIR="/tmp/browser-mcp-setup-$$"
    git clone https://github.com/YOLOVibeCode/browser-mcp.git "$TEMP_DIR" 2>&1 | tail -5

    if [ ! -d "$TEMP_DIR" ]; then
        echo -e "${RED}❌ Failed to clone repository${NC}"
        exit 1
    fi

    cd "$TEMP_DIR"
    PROJECT_PATH="$TEMP_DIR"
    echo -e "${GREEN}✅ Repository cloned${NC}"
    echo ""
else
    # Get absolute project path (script is in scripts/ subdirectory)
    SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
    PROJECT_PATH=$(cd "$SCRIPT_DIR/.." && pwd)
fi

echo -e "${BLUE}📍 Project location:${NC} $PROJECT_PATH"
echo ""

# Detect OS
OS=$(uname -s)
case "$OS" in
    Darwin)
        OS_NAME="macOS"
        ;;
    Linux)
        OS_NAME="Linux"
        ;;
    MINGW*|MSYS*|CYGWIN*)
        OS_NAME="Windows"
        ;;
    *)
        OS_NAME="Unknown"
        ;;
esac

echo -e "${BLUE}💻 Operating System:${NC} $OS_NAME"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check prerequisites
echo -e "${GREEN}▶ Checking Prerequisites${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MISSING_PREREQS=()

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo -e "   ${GREEN}✅ Node.js${NC} $NODE_VERSION"
else
    echo -e "   ${RED}❌ Node.js${NC} not found"
    MISSING_PREREQS+=("node")
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo -e "   ${GREEN}✅ npm${NC} v$NPM_VERSION"
else
    echo -e "   ${RED}❌ npm${NC} not found"
    MISSING_PREREQS+=("npm")
fi

# Check Git
if command_exists git; then
    GIT_VERSION=$(git --version)
    echo -e "   ${GREEN}✅ Git${NC} $GIT_VERSION"
else
    echo -e "   ${RED}❌ Git${NC} not found"
    MISSING_PREREQS+=("git")
fi

# Check Chrome/Chromium
if [ "$OS_NAME" = "macOS" ]; then
    if [ -d "/Applications/Google Chrome.app" ] || [ -d "/Applications/Chromium.app" ]; then
        echo -e "   ${GREEN}✅ Chrome/Chromium${NC} detected"
    else
        echo -e "   ${YELLOW}⚠️  Chrome/Chromium${NC} not detected"
    fi
elif [ "$OS_NAME" = "Linux" ]; then
    if command_exists google-chrome || command_exists chromium || command_exists chromium-browser; then
        echo -e "   ${GREEN}✅ Chrome/Chromium${NC} detected"
    else
        echo -e "   ${YELLOW}⚠️  Chrome/Chromium${NC} not detected"
    fi
fi

# Install missing prerequisites
if [ ${#MISSING_PREREQS[@]} -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}⚠️  Missing prerequisites:${NC} ${MISSING_PREREQS[*]}"
    echo ""
    echo "Please install:"

    if [[ " ${MISSING_PREREQS[@]} " =~ " node " ]] || [[ " ${MISSING_PREREQS[@]} " =~ " npm " ]]; then
        echo "  • Node.js: https://nodejs.org/ (includes npm)"
    fi

    if [[ " ${MISSING_PREREQS[@]} " =~ " git " ]]; then
        echo "  • Git: https://git-scm.com/"
    fi

    echo ""
    exit 1
fi

echo ""
echo -e "${GREEN}✅ All prerequisites satisfied${NC}"
echo ""

# Step 1: Install MCP Server from NPM
echo -e "${GREEN}▶ Step 1: Installing Browser MCP Server${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if already installed
if command_exists browser-mcp-server; then
    INSTALLED_VERSION=$(npm list -g @rvegajr/browser-mcp-server --depth=0 2>/dev/null | grep browser-mcp-server | awk '{print $2}' | tr -d '@')
    echo -e "   ${YELLOW}⚠️  Browser MCP Server already installed (v${INSTALLED_VERSION})${NC}"

    if [ "$AUTO_ACCEPT" = true ]; then
        echo -e "   ${YELLOW}Auto-accepting: Reinstalling...${NC}"
        response="y"
    else
        echo -n "   Reinstall? (y/n): "
        read -r response
    fi

    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        echo -e "   ${BLUE}Uninstalling old version...${NC}"
        npm uninstall -g @rvegajr/browser-mcp-server 2>&1 | grep -v "npm WARN"
    else
        echo -e "   ${GREEN}✅ Using existing installation${NC}"
        echo ""
        SKIP_NPM_INSTALL=true
    fi
fi

if [ "$SKIP_NPM_INSTALL" != "true" ]; then
    echo -e "   ${BLUE}Installing via NPM...${NC}"

    # Install from NPM registry
    npm install -g @rvegajr/browser-mcp-server 2>&1 | tail -5

    if [ $? -eq 0 ]; then
        echo -e "   ${GREEN}✅ Browser MCP Server installed${NC}"

        # Verify installation
        if command_exists browser-mcp-server; then
            echo -e "   ${GREEN}✅ Command 'browser-mcp-server' is available${NC}"
        else
            echo -e "   ${YELLOW}⚠️  Command not found in PATH${NC}"
            echo -e "   ${YELLOW}   You may need to restart your terminal${NC}"
        fi
    else
        echo -e "   ${RED}❌ Installation failed${NC}"
        echo -e "   ${YELLOW}   Try manual install: npm install -g browser-mcp-server${NC}"
        exit 1
    fi
fi

echo ""

# Step 2: Detect IDEs
echo -e "${GREEN}▶ Step 2: Detecting IDEs${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

FOUND_IDES=()

# Check for Claude Desktop
if [ "$OS_NAME" = "macOS" ]; then
    if [ -d "$HOME/Library/Application Support/Claude" ]; then
        echo -e "   ${GREEN}✅ Claude Desktop detected${NC}"
        FOUND_IDES+=("claude")
    fi
fi

# Check for Cursor
if [ -d "$HOME/.cursor" ]; then
    echo -e "   ${GREEN}✅ Cursor IDE detected${NC}"
    FOUND_IDES+=("cursor")
fi

# Check for Windsurf
if [ -d "$HOME/.codeium/windsurf" ]; then
    echo -e "   ${GREEN}✅ Windsurf IDE detected${NC}"
    FOUND_IDES+=("windsurf")
fi

if [ ${#FOUND_IDES[@]} -eq 0 ]; then
    echo -e "   ${YELLOW}⚠️  No supported IDEs detected${NC}"
    echo -e "   ${BLUE}   Supported: Claude Desktop, Cursor, Windsurf${NC}"
fi

echo ""

# Step 3: Configure IDEs
if [ ${#FOUND_IDES[@]} -gt 0 ]; then
    echo -e "${GREEN}▶ Step 3: Configuring IDEs${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Configure Claude Desktop
    if [[ " ${FOUND_IDES[@]} " =~ " claude " ]]; then
        echo -e "${BLUE}Configuring Claude Desktop...${NC}"
        CONFIG_DIR="$HOME/Library/Application Support/Claude"
        CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

        mkdir -p "$CONFIG_DIR"

        # Backup existing config
        if [ -f "$CONFIG_FILE" ]; then
            BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
            cp "$CONFIG_FILE" "$BACKUP_FILE"
            echo -e "   ${YELLOW}📦 Backed up existing config${NC}"
        fi

        # Create/update config
        cat > "$CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-server"
    }
  }
}
EOF
        echo -e "   ${GREEN}✅ Claude Desktop configured${NC}"
        echo ""
    fi

    # Configure Cursor
    if [[ " ${FOUND_IDES[@]} " =~ " cursor " ]]; then
        echo -e "${BLUE}Configuring Cursor IDE...${NC}"
        CONFIG_DIR="$HOME/.cursor"
        CONFIG_FILE="$CONFIG_DIR/mcp.json"

        mkdir -p "$CONFIG_DIR"

        # Backup existing config
        if [ -f "$CONFIG_FILE" ]; then
            BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
            cp "$CONFIG_FILE" "$BACKUP_FILE"
            echo -e "   ${YELLOW}📦 Backed up existing config${NC}"
        fi

        # Create/update config
        cat > "$CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-server"
    }
  }
}
EOF
        echo -e "   ${GREEN}✅ Cursor IDE configured${NC}"
        echo ""
    fi

    # Configure Windsurf
    if [[ " ${FOUND_IDES[@]} " =~ " windsurf " ]]; then
        echo -e "${BLUE}Configuring Windsurf IDE...${NC}"
        CONFIG_DIR="$HOME/.codeium/windsurf"
        CONFIG_FILE="$CONFIG_DIR/mcp_config.json"

        mkdir -p "$CONFIG_DIR"

        # Backup existing config
        if [ -f "$CONFIG_FILE" ]; then
            BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
            cp "$CONFIG_FILE" "$BACKUP_FILE"
            echo -e "   ${YELLOW}📦 Backed up existing config${NC}"
        fi

        # Create/update config
        cat > "$CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-server"
    }
  }
}
EOF
        echo -e "   ${GREEN}✅ Windsurf IDE configured${NC}"
        echo ""
    fi
fi

# Step 4: Extension Installation
echo -e "${GREEN}▶ Step 4: Chrome Extension${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

echo -e "   ${BLUE}📦 Extension Location:${NC}"
echo "      $PROJECT_PATH/browser-mcp-extension/"
echo ""
echo -e "   ${YELLOW}📋 To install (if not already installed):${NC}"
echo "      1. Open Chrome and go to: ${BLUE}chrome://extensions/${NC}"
echo "      2. Enable ${BLUE}'Developer mode'${NC} (toggle in top-right)"
echo "      3. Click ${BLUE}'Load unpacked'${NC}"
echo "      4. Select folder: ${BLUE}$PROJECT_PATH/browser-mcp-extension/${NC}"
echo ""

# Try to copy to clipboard
if command_exists pbcopy; then
    echo "$PROJECT_PATH/browser-mcp-extension/" | pbcopy
    echo -e "   ${GREEN}✅ Path copied to clipboard!${NC}"
elif command_exists xclip; then
    echo "$PROJECT_PATH/browser-mcp-extension/" | xclip -selection clipboard
    echo -e "   ${GREEN}✅ Path copied to clipboard!${NC}"
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

echo -e "${GREEN}✅ What was installed:${NC}"
echo ""
echo "  📦 MCP Server:"
echo "     Command: ${BLUE}browser-mcp-server${NC}"
echo "     Version: 4.0.0"
echo "     Architecture: WebSocket (ws://localhost:8765)"
echo ""

if [ ${#FOUND_IDES[@]} -gt 0 ]; then
    echo "  📦 IDEs Configured:"
    for ide in "${FOUND_IDES[@]}"; do
        echo "     • $ide"
    done
    echo ""
fi

echo -e "${YELLOW}📋 Next Steps:${NC}"
echo ""
echo "  ${BLUE}1. Load Chrome Extension:${NC}"
echo "     • Open: ${BLUE}chrome://extensions/${NC}"
echo "     • Enable 'Developer mode'"
echo "     • Click 'Load unpacked'"
echo "     • Select: ${BLUE}$PROJECT_PATH/browser-mcp-extension/${NC}"
echo ""
echo "  ${BLUE}2. Restart your IDE:${NC}"
if [[ " ${FOUND_IDES[@]} " =~ " claude " ]]; then
    echo "     • Claude Desktop: Quit (Cmd+Q) and reopen"
fi
if [[ " ${FOUND_IDES[@]} " =~ " cursor " ]]; then
    echo "     • Cursor: Quit (Cmd+Q) and reopen"
fi
if [[ " ${FOUND_IDES[@]} " =~ " windsurf " ]]; then
    echo "     • Windsurf: Quit (Cmd+Q) and reopen"
fi
echo ""
echo "  ${BLUE}3. Test in your IDE:${NC}"
echo "     Ask: ${GREEN}'What MCP servers are available?'${NC}"
echo "     Expected: ${GREEN}'browser-mcp' with 33 tools${NC}"
echo ""
echo "  ${BLUE}4. Use the tools:${NC}"
echo "     Ask: ${GREEN}'List all tabs in my browser'${NC}"
echo "     Ask: ${GREEN}'Get the DOM of the current page'${NC}"
echo "     Ask: ${GREEN}'Show me the console errors'${NC}"
echo ""

echo -e "${GREEN}📚 Documentation:${NC}"
echo "  • Main README: $PROJECT_PATH/README.md"
echo "  • MCP Server: $PROJECT_PATH/mcp-server/README.md"
echo "  • Extension: $PROJECT_PATH/browser-mcp-extension/README.md"
echo ""

echo -e "${BLUE}✨ Ready to expose browser state to AI! ✨${NC}"
echo ""
