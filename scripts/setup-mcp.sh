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
echo "║                      v3.0.4                                ║"
echo "║                                                            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

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

# ============================================================================
# PREREQUISITE CHECKS & INSTALLATION
# ============================================================================

echo -e "${GREEN}▶ Checking Prerequisites${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

MISSING_PREREQS=()
INSTALL_COMMANDS=()

# Function to install prerequisites
install_prerequisites() {
    local prereq=$1

    case "$OS_NAME" in
        macOS)
            case "$prereq" in
                node)
                    echo -e "   ${BLUE}Installing Node.js via Homebrew...${NC}"
                    if ! command -v brew &> /dev/null; then
                        echo -e "   ${YELLOW}Installing Homebrew first...${NC}"
                        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                    fi
                    brew install node
                    ;;
                python3)
                    echo -e "   ${BLUE}Installing Python3 via Homebrew...${NC}"
                    if ! command -v brew &> /dev/null; then
                        echo -e "   ${YELLOW}Installing Homebrew first...${NC}"
                        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                    fi
                    brew install python3
                    ;;
                git)
                    echo -e "   ${BLUE}Installing Git via Homebrew...${NC}"
                    if ! command -v brew &> /dev/null; then
                        echo -e "   ${YELLOW}Installing Homebrew first...${NC}"
                        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
                    fi
                    brew install git
                    ;;
            esac
            ;;

        Linux)
            # Detect Linux package manager
            if command -v apt-get &> /dev/null; then
                PKG_MANAGER="apt-get"
                UPDATE_CMD="sudo apt-get update"
            elif command -v yum &> /dev/null; then
                PKG_MANAGER="yum"
                UPDATE_CMD="sudo yum check-update"
            elif command -v dnf &> /dev/null; then
                PKG_MANAGER="dnf"
                UPDATE_CMD="sudo dnf check-update"
            elif command -v pacman &> /dev/null; then
                PKG_MANAGER="pacman"
                UPDATE_CMD="sudo pacman -Sy"
            elif command -v zypper &> /dev/null; then
                PKG_MANAGER="zypper"
                UPDATE_CMD="sudo zypper refresh"
            else
                echo -e "   ${RED}❌ Could not detect package manager${NC}"
                return 1
            fi

            case "$prereq" in
                node)
                    echo -e "   ${BLUE}Installing Node.js...${NC}"
                    case "$PKG_MANAGER" in
                        apt-get)
                            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
                            sudo apt-get install -y nodejs
                            ;;
                        yum|dnf)
                            curl -fsSL https://rpm.nodesource.com/setup_lts.x | sudo bash -
                            sudo $PKG_MANAGER install -y nodejs
                            ;;
                        pacman)
                            sudo pacman -S --noconfirm nodejs npm
                            ;;
                        zypper)
                            sudo zypper install -y nodejs npm
                            ;;
                    esac
                    ;;
                python3)
                    echo -e "   ${BLUE}Installing Python3...${NC}"
                    case "$PKG_MANAGER" in
                        apt-get)
                            sudo apt-get install -y python3 python3-pip
                            ;;
                        yum|dnf)
                            sudo $PKG_MANAGER install -y python3 python3-pip
                            ;;
                        pacman)
                            sudo pacman -S --noconfirm python python-pip
                            ;;
                        zypper)
                            sudo zypper install -y python3 python3-pip
                            ;;
                    esac
                    ;;
                git)
                    echo -e "   ${BLUE}Installing Git...${NC}"
                    sudo $PKG_MANAGER install -y git
                    ;;
            esac
            ;;

        Windows)
            echo -e "   ${YELLOW}⚠️  Windows detected - please install prerequisites manually:${NC}"
            case "$prereq" in
                node)
                    echo "      Node.js: https://nodejs.org/en/download/"
                    ;;
                python3)
                    echo "      Python3: https://www.python.org/downloads/"
                    ;;
                git)
                    echo "      Git: https://git-scm.com/download/win"
                    ;;
            esac
            return 1
            ;;
    esac
}

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "   ${GREEN}✅ Node.js${NC} $NODE_VERSION"
else
    echo -e "   ${RED}❌ Node.js not found${NC}"
    MISSING_PREREQS+=("node")
fi

# Check Python3
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version 2>&1)
    echo -e "   ${GREEN}✅ Python3${NC} $PYTHON_VERSION"
else
    echo -e "   ${RED}❌ Python3 not found${NC}"
    MISSING_PREREQS+=("python3")
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    echo -e "   ${GREEN}✅ Git${NC} $GIT_VERSION"
else
    echo -e "   ${RED}❌ Git not found${NC}"
    MISSING_PREREQS+=("git")
fi

# Check Chrome/Chromium
if [ -d "/Applications/Google Chrome.app" ] || [ -d "/Applications/Chromium.app" ] || command -v google-chrome &> /dev/null || command -v chromium &> /dev/null || command -v chromium-browser &> /dev/null; then
    echo -e "   ${GREEN}✅ Chrome/Chromium${NC} detected"
else
    echo -e "   ${YELLOW}⚠️  Chrome/Chromium not detected${NC}"
    echo "      Install Chrome: https://www.google.com/chrome/"
fi

echo ""

# Install missing prerequisites
if [ ${#MISSING_PREREQS[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing prerequisites: ${MISSING_PREREQS[*]}${NC}"
    echo ""

    if [ "$OS_NAME" = "Windows" ]; then
        echo -e "${RED}Please install the missing prerequisites manually and run this script again.${NC}"
        exit 1
    fi

    echo -n "Install missing prerequisites automatically? (y/n): "
    read -r response
    echo ""

    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        for prereq in "${MISSING_PREREQS[@]}"; do
            install_prerequisites "$prereq"

            # Verify installation
            if command -v "$prereq" &> /dev/null || command -v "${prereq/3/}" &> /dev/null; then
                echo -e "   ${GREEN}✅ $prereq installed successfully${NC}"
            else
                echo -e "   ${RED}❌ $prereq installation failed${NC}"
                echo -e "${RED}Please install $prereq manually and run this script again.${NC}"
                exit 1
            fi
        done
        echo ""
        echo -e "${GREEN}✅ All prerequisites installed${NC}"
        echo ""
    else
        echo -e "${RED}Cannot proceed without required prerequisites.${NC}"
        echo "Please install: ${MISSING_PREREQS[*]}"
        exit 1
    fi
else
    echo -e "${GREEN}✅ All prerequisites satisfied${NC}"
    echo ""
fi

# ============================================================================
# CONFIGURATION FUNCTIONS
# ============================================================================

# Function to create MCP config
create_mcp_config() {
    local config_file=$1
    cat > "$config_file" << EOFCONFIG
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-host"
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
        # Check if browser-mcp already exists
        if grep -q "browser-mcp" "$config_file"; then
            echo -e "   ${YELLOW}⚠️  browser-mcp already exists in config${NC}"
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
        "browser-mcp": {
            "command": "browser-mcp-host"
        }
    }

    if "mcpServers" not in existing:
        existing["mcpServers"] = {}

    existing["mcpServers"]["browser-mcp"] = new_server["browser-mcp"]

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

# Step 1: Install Native Messaging Host via NPM
echo -e "${GREEN}▶ Step 1: Installing Native Messaging Host${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if already installed
if command -v browser-mcp-host &> /dev/null; then
    INSTALLED_VERSION=$(npm list -g browser-mcp-native-host --depth=0 2>/dev/null | grep browser-mcp-native-host | awk '{print $2}' | tr -d '@')
    echo -e "   ${YELLOW}⚠️  Native host already installed (v${INSTALLED_VERSION})${NC}"
    echo -n "   Reinstall? (y/n): "
    read -r response

    if [ "$response" = "y" ] || [ "$response" = "Y" ]; then
        echo -e "   ${BLUE}Uninstalling old version...${NC}"
        npm uninstall -g browser-mcp-native-host 2>&1 | grep -v "npm WARN"
    else
        echo -e "   ${GREEN}✅ Using existing installation${NC}"
        echo ""
        # Skip to next step
        SKIP_NPM_INSTALL=true
    fi
fi

if [ "$SKIP_NPM_INSTALL" != "true" ]; then
    echo -e "   ${BLUE}Installing via NPM...${NC}"

    # Install from local directory if we have it
    if [ -f "$PROJECT_PATH/native-messaging-host/package.json" ]; then
        cd "$PROJECT_PATH/native-messaging-host"
        npm install -g . 2>&1 | tail -5
    else
        # Install from NPM registry
        npm install -g browser-mcp-native-host 2>&1 | tail -5
    fi

    if [ $? -eq 0 ]; then
        echo -e "   ${GREEN}✅ Native messaging host installed${NC}"

        # Verify installation
        if command -v browser-mcp-host &> /dev/null; then
            echo -e "   ${GREEN}✅ Command 'browser-mcp-host' is available${NC}"
        else
            echo -e "   ${YELLOW}⚠️  Command not found in PATH${NC}"
            echo -e "   ${YELLOW}   You may need to restart your terminal${NC}"
        fi
    else
        echo -e "   ${RED}❌ Native messaging host installation failed${NC}"
        echo -e "   ${YELLOW}   Try manual install: npm install -g browser-mcp-native-host${NC}"
        exit 1
    fi
fi

echo ""

# Step 2: Detect IDEs
echo -e "${GREEN}▶ Step 2: Detecting IDEs${NC}"
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
    echo "You can configure manually:"
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

# Step 3: Setup for each IDE
for IDE in "${FOUND_IDES[@]}"; do
    case "$IDE" in
        claude)
            echo -e "${GREEN}▶ Step 3a: Configuring Claude Desktop${NC}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

            mkdir -p "$CLAUDE_CONFIG_DIR"
            echo -e "   ${GREEN}✅ Created config directory${NC}"

            CLAUDE_CONFIG_FILE="$CLAUDE_CONFIG_DIR/claude_desktop_config.json"

            if [ -f "$CLAUDE_CONFIG_FILE" ]; then
                backup_config "$CLAUDE_CONFIG_FILE"
            fi

            if merge_config "$CLAUDE_CONFIG_FILE"; then
                echo -e "   ${GREEN}✅ Claude Desktop configured${NC}"
                echo "      Config: $CLAUDE_CONFIG_FILE"
            else
                echo -e "   ${YELLOW}⚠️  Claude Desktop configuration skipped${NC}"
            fi
            echo ""
            ;;

        cursor)
            echo -e "${GREEN}▶ Step 3b: Configuring Cursor IDE${NC}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

            mkdir -p "$CURSOR_CONFIG_DIR"
            echo -e "   ${GREEN}✅ Created config directory${NC}"

            CURSOR_CONFIG_FILE="$CURSOR_CONFIG_DIR/mcp.json"

            if [ -f "$CURSOR_CONFIG_FILE" ]; then
                backup_config "$CURSOR_CONFIG_FILE"
            fi

            if merge_config "$CURSOR_CONFIG_FILE"; then
                echo -e "   ${GREEN}✅ Cursor IDE configured${NC}"
                echo "      Config: $CURSOR_CONFIG_FILE"
            else
                echo -e "   ${YELLOW}⚠️  Cursor IDE configuration skipped${NC}"
            fi
            echo ""
            ;;

        windsurf)
            echo -e "${GREEN}▶ Step 3c: Configuring Windsurf IDE${NC}"
            echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

            mkdir -p "$WINDSURF_CONFIG_DIR"
            echo -e "   ${GREEN}✅ Created config directory${NC}"

            WINDSURF_CONFIG_FILE="$WINDSURF_CONFIG_DIR/mcp_config.json"

            if [ -f "$WINDSURF_CONFIG_FILE" ]; then
                backup_config "$WINDSURF_CONFIG_FILE"
            fi

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

# Step 4: Chrome Extension Check
echo -e "${GREEN}▶ Step 4: Chrome Extension${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to check if extension is installed
check_extension_installed() {
    local extensions_dir

    case "$OS_NAME" in
        macOS)
            extensions_dir="$HOME/Library/Application Support/Google/Chrome/Default/Extensions"
            ;;
        Linux)
            extensions_dir="$HOME/.config/google-chrome/Default/Extensions"
            ;;
        Windows)
            extensions_dir="$LOCALAPPDATA/Google/Chrome/User Data/Default/Extensions"
            ;;
        *)
            return 1
            ;;
    esac

    if [ ! -d "$extensions_dir" ]; then
        return 1
    fi

    # Look for Browser MCP extension
    for ext_id in "$extensions_dir"/*; do
        if [ -d "$ext_id" ]; then
            local versions=$(ls "$ext_id" 2>/dev/null)
            if [ -n "$versions" ]; then
                for version in $versions; do
                    local manifest="$ext_id/$version/manifest.json"
                    if [ -f "$manifest" ]; then
                        if grep -q "Browser MCP" "$manifest" 2>/dev/null; then
                            echo "$ext_id" | xargs basename
                            return 0
                        fi
                    fi
                done
            fi
        fi
    done

    return 1
}

# Check if extension is already installed
EXTENSION_ID=$(check_extension_installed)

if [ -n "$EXTENSION_ID" ]; then
    echo -e "   ${GREEN}✅ Browser MCP extension is already installed${NC}"
    echo "      Extension ID: $EXTENSION_ID"
    echo ""
    echo "   ${GREEN}🎉 You're all set! No manual installation needed.${NC}"
else
    echo -e "   ${YELLOW}⚠️  Extension not detected in Chrome${NC}"
    echo ""

    if [ -d "$PROJECT_PATH/browser-mcp-extension" ]; then
        echo "   ${BLUE}📦 Extension Location:${NC}"
        echo "      $PROJECT_PATH/browser-mcp-extension/"
        echo ""
        echo "   ${YELLOW}📋 To install:${NC}"
        echo "      1. Open Chrome and go to: ${BLUE}chrome://extensions/${NC}"
        echo "      2. Enable ${BLUE}'Developer mode'${NC} (toggle in top-right)"
        echo "      3. Click ${BLUE}'Load unpacked'${NC}"
        echo "      4. Select folder: ${BLUE}$PROJECT_PATH/browser-mcp-extension/${NC}"
        echo ""
        echo "   ${GREEN}💡 Tip:${NC} Copy this path to clipboard:"
        echo "      ${BLUE}$PROJECT_PATH/browser-mcp-extension/${NC}"

        # Try to copy to clipboard
        if command -v pbcopy &> /dev/null; then
            echo "$PROJECT_PATH/browser-mcp-extension/" | pbcopy
            echo ""
            echo "   ${GREEN}✅ Path copied to clipboard!${NC}"
        elif command -v xclip &> /dev/null; then
            echo "$PROJECT_PATH/browser-mcp-extension/" | xclip -selection clipboard
            echo ""
            echo "   ${GREEN}✅ Path copied to clipboard!${NC}"
        fi
    else
        echo -e "   ${RED}❌ Extension directory not found${NC}"
        echo "      Expected: $PROJECT_PATH/browser-mcp-extension/"
    fi
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

# Only show extension step if not installed
if [ -z "$EXTENSION_ID" ]; then
    echo "  ${BLUE}${step}. Install Chrome Extension:${NC}"
    echo "     • Open: ${BLUE}chrome://extensions/${NC}"
    echo "     • Enable 'Developer mode'"
    echo "     • Click 'Load unpacked'"
    echo "     • Select: ${BLUE}$PROJECT_PATH/browser-mcp-extension/${NC}"
    echo ""
    ((step++))
fi

for IDE in "${FOUND_IDES[@]}"; do
    case "$IDE" in
        claude)
            echo "  ${step}. Restart Claude Desktop (Cmd+Q, then reopen)"
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

echo "  ${step}. Test in your IDE:"
echo "     Ask: ${GREEN}'What MCP servers are available?'${NC}"
echo "     Expected: ${GREEN}'browser-mcp'${NC}"
echo ""

echo -e "${GREEN}📚 Documentation:${NC}"
echo "  • README: $PROJECT_PATH/README.md"
echo "  • Extension Docs: $PROJECT_PATH/browser-mcp-extension/README.md"
echo ""

echo -e "${BLUE}✨ Ready to expose browser state to AI! ✨${NC}"
echo ""
