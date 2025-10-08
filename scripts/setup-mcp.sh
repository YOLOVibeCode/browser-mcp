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

# Disable colors and special characters for clean output
GREEN=''
BLUE=''
YELLOW=''
RED=''
NC=''

echo "============================================================"
echo ""
echo "        Browser MCP - Automatic Setup Utility"
echo "                      v4.0.0"
echo "              WebSocket Architecture"
echo ""
echo "============================================================"
echo ""

if [ "$AUTO_ACCEPT" = true ]; then
    echo "Running in auto-accept mode (--yes)"
    echo ""
fi

# Detect if we're running from curl | bash
if [ "$0" = "bash" ]; then
    echo "Running from curl | bash - cloning repository first..."
    echo ""

    # Clone to Downloads directory instead of /tmp
    TEMP_DIR="$HOME/Downloads/browser-mcp-setup"

    # Remove old installation if it exists
    if [ -d "$TEMP_DIR" ]; then
        echo "Removing previous installation..."
        rm -rf "$TEMP_DIR"
    fi

    git clone https://github.com/YOLOVibeCode/browser-mcp.git "$TEMP_DIR" 2>&1 | tail -5

    if [ ! -d "$TEMP_DIR" ]; then
        echo "ERROR: Failed to clone repository"
        exit 1
    fi

    cd "$TEMP_DIR"
    PROJECT_PATH="$TEMP_DIR"
    echo "PASS: Repository cloned"
    echo ""
else
    # Get absolute project path (script is in scripts/ subdirectory)
    SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
    PROJECT_PATH=$(cd "$SCRIPT_DIR/.." && pwd)
fi

echo "Project location: $PROJECT_PATH"
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

echo "Operating System: $OS_NAME"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" &> /dev/null
}

# Check prerequisites
echo "▶ Checking Prerequisites"
echo "------------------------------------------------------------"

MISSING_PREREQS=()

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version)
    echo "   PASS: Node.js $NODE_VERSION"
else
    echo "   ERROR: Node.js not found"
    MISSING_PREREQS+=("node")
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm --version)
    echo "   PASS: npm v$NPM_VERSION"
else
    echo "   ERROR: npm not found"
    MISSING_PREREQS+=("npm")
fi

# Check Git
if command_exists git; then
    GIT_VERSION=$(git --version)
    echo "   PASS: Git $GIT_VERSION"
else
    echo "   ERROR: Git not found"
    MISSING_PREREQS+=("git")
fi

# Check Chrome/Chromium
if [ "$OS_NAME" = "macOS" ]; then
    if [ -d "/Applications/Google Chrome.app" ] || [ -d "/Applications/Chromium.app" ]; then
        echo "   PASS: Chrome/Chromium detected"
    else
        echo "   WARNING: Chrome/Chromium not detected"
    fi
elif [ "$OS_NAME" = "Linux" ]; then
    if command_exists google-chrome || command_exists chromium || command_exists chromium-browser; then
        echo "   PASS: Chrome/Chromium detected"
    else
        echo "   WARNING: Chrome/Chromium not detected"
    fi
fi

# Install missing prerequisites
if [ ${#MISSING_PREREQS[@]} -gt 0 ]; then
    echo ""
    echo "WARNING: Missing prerequisites: ${MISSING_PREREQS[*]}"
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
echo "PASS: All prerequisites satisfied"
echo ""

# Step 1: Install MCP Server from NPM
echo "▶ Step 1: Installing Browser MCP Server"
echo "------------------------------------------------------------"

# Check if already installed
if command_exists browser-mcp-server; then
    INSTALLED_VERSION=$(npm list -g @rvegajr/browser-mcp-server --depth=0 2>/dev/null | grep browser-mcp-server | awk '{print $2}' | tr -d '@')
    echo "   WARNING: Browser MCP Server already installed (v${INSTALLED_VERSION})"

    if [ "$AUTO_ACCEPT" = true ]; then
        echo "   Auto-accepting: Reinstalling..."
        response="y"
    else
        echo -n "   Reinstall? (y/n): "
        read -r response
    fi

    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        echo "   Uninstalling old version..."
        npm uninstall -g @rvegajr/browser-mcp-server 2>&1 | grep -v "npm WARN"
    else
        echo "   PASS: Using existing installation"
        echo ""
        SKIP_NPM_INSTALL=true
    fi
fi

if [ "$SKIP_NPM_INSTALL" != "true" ]; then
    echo "   Installing via NPM..."

    # Install from NPM registry
    npm install -g @rvegajr/browser-mcp-server 2>&1 | tail -5

    if [ $? -eq 0 ]; then
        echo "   PASS: Browser MCP Server installed"

        # Verify installation
        if command_exists browser-mcp-server; then
            echo "   PASS: Command 'browser-mcp-server' is available"
        else
            echo "   WARNING: Command not found in PATH"
            echo "      You may need to restart your terminal"
        fi
    else
        echo "   ERROR: Installation failed"
        echo "      Try manual install: npm install -g browser-mcp-server"
        exit 1
    fi
fi

echo ""

# Step 2: Detect IDEs
echo "▶ Step 2: Detecting IDEs"
echo "------------------------------------------------------------"

FOUND_IDES=()

# Check for Claude Desktop
if [ "$OS_NAME" = "macOS" ]; then
    if [ -d "$HOME/Library/Application Support/Claude" ]; then
        echo "   PASS: Claude Desktop detected"
        FOUND_IDES+=("claude")
    fi
fi

# Check for Cursor
if [ -d "$HOME/.cursor" ]; then
    echo "   PASS: Cursor IDE detected"
    FOUND_IDES+=("cursor")
fi

# Check for Windsurf
if [ -d "$HOME/.codeium/windsurf" ]; then
    echo "   PASS: Windsurf IDE detected"
    FOUND_IDES+=("windsurf")
fi

if [ ${#FOUND_IDES[@]} -eq 0 ]; then
    echo "   WARNING: No supported IDEs detected"
    echo "      Supported: Claude Desktop, Cursor, Windsurf"
fi

echo ""

# Step 3: Configure IDEs
if [ ${#FOUND_IDES[@]} -gt 0 ]; then
    echo "▶ Step 3: Configuring IDEs"
    echo "------------------------------------------------------------"

    # Configure Claude Desktop
    if [[ " ${FOUND_IDES[@]} " =~ " claude " ]]; then
        echo "Configuring Claude Desktop..."
        CONFIG_DIR="$HOME/Library/Application Support/Claude"
        CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

        mkdir -p "$CONFIG_DIR"

        # Backup existing config
        if [ -f "$CONFIG_FILE" ]; then
            BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
            cp "$CONFIG_FILE" "$BACKUP_FILE"
            echo "   INFO: Backed up existing config"
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
        echo "   PASS: Claude Desktop configured"
        echo ""
    fi

    # Configure Cursor
    if [[ " ${FOUND_IDES[@]} " =~ " cursor " ]]; then
        echo "Configuring Cursor IDE..."
        CONFIG_DIR="$HOME/.cursor"
        CONFIG_FILE="$CONFIG_DIR/mcp.json"

        mkdir -p "$CONFIG_DIR"

        # Backup existing config
        if [ -f "$CONFIG_FILE" ]; then
            BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
            cp "$CONFIG_FILE" "$BACKUP_FILE"
            echo "   INFO: Backed up existing config"
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
        echo "   PASS: Cursor IDE configured"
        echo ""
    fi

    # Configure Windsurf
    if [[ " ${FOUND_IDES[@]} " =~ " windsurf " ]]; then
        echo "Configuring Windsurf IDE..."
        CONFIG_DIR="$HOME/.codeium/windsurf"
        CONFIG_FILE="$CONFIG_DIR/mcp_config.json"

        mkdir -p "$CONFIG_DIR"

        # Backup existing config
        if [ -f "$CONFIG_FILE" ]; then
            BACKUP_FILE="$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
            cp "$CONFIG_FILE" "$BACKUP_FILE"
            echo "   INFO: Backed up existing config"
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
        echo "   PASS: Windsurf IDE configured"
        echo ""
    fi
fi

# Step 4: Extension Installation
echo "▶ Step 4: Chrome Extension"
echo "------------------------------------------------------------"

echo "   Extension Location:"
echo "      $PROJECT_PATH/browser-mcp-extension/"
echo ""
echo "   Note: To install (if not already installed):"
echo "      1. Open Chrome and go to: chrome://extensions/"
echo "      2. Enable 'Developer mode' (toggle in top-right)"
echo "      3. Click 'Load unpacked'"
echo "      4. Select folder: $PROJECT_PATH/browser-mcp-extension/"
echo ""

# Try to copy to clipboard
if command_exists pbcopy; then
    echo "$PROJECT_PATH/browser-mcp-extension/" | pbcopy
    echo "   PASS: Path copied to clipboard!"
elif command_exists xclip; then
    echo "$PROJECT_PATH/browser-mcp-extension/" | xclip -selection clipboard
    echo "   PASS: Path copied to clipboard!"
fi

echo ""

# Summary
echo ""
echo ""
echo "============================================================"
echo ""
echo "                   Setup Complete!"
echo ""
echo "============================================================"
echo ""
echo ""

echo "PASS: What was installed:"
echo ""
echo "  MCP Server:"
echo "     Command: browser-mcp-server"
echo "     Version: 4.0.0"
echo "     Architecture: WebSocket (ws://localhost:8765)"
echo ""

if [ ${#FOUND_IDES[@]} -gt 0 ]; then
    echo "  IDEs Configured:"
    for ide in "${FOUND_IDES[@]}"; do
        echo "     • $ide"
    done
    echo ""
fi

echo "Note: Next Steps:"
echo ""
echo "  1. Load Chrome Extension:"
echo "     • Open: chrome://extensions/"
echo "     • Enable 'Developer mode'"
echo "     • Click 'Load unpacked'"
echo "     • Select: $PROJECT_PATH/browser-mcp-extension/"
echo ""
echo "  2. Restart your IDE:"
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
echo "  3. Test in your IDE:"
echo "     Ask: 'What MCP servers are available?'"
echo "     Expected: 'browser-mcp' with 33 tools"
echo ""
echo "  4. Use the tools:"
echo "     Ask: 'List all tabs in my browser'"
echo "     Ask: 'Get the DOM of the current page'"
echo "     Ask: 'Show me the console errors'"
echo ""

echo "Documentation:"
echo "  • Main README: $PROJECT_PATH/README.md"
echo "  • MCP Server: $PROJECT_PATH/mcp-server/README.md"
echo "  • Extension: $PROJECT_PATH/browser-mcp-extension/README.md"
echo ""

echo "Ready to expose browser state to AI!"
echo ""
