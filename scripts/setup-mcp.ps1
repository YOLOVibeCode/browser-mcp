# Browser MCP - Automatic Setup Utility (PowerShell)
# Version: 4.0.0
# WebSocket Architecture

param(
    [switch]$Yes,
    [switch]$Y,
    [switch]$Help,
    [switch]$H
)

# Handle help flag
if ($Help -or $H) {
    Write-Host @"
Browser MCP Setup - PowerShell Installer

Usage:
  .\setup-mcp.ps1 [options]

Options:
  -Yes, -Y    Auto-accept all prompts (non-interactive mode)
  -Help, -H   Show this help message

Examples:
  .\setup-mcp.ps1              # Interactive install
  .\setup-mcp.ps1 -Yes         # Auto-install without prompts

Or run remotely:
  irm https://raw.githubusercontent.com/YOLOVibeCode/browser-mcp/main/scripts/setup-mcp.ps1 | iex
  irm https://raw.githubusercontent.com/YOLOVibeCode/browser-mcp/main/scripts/setup-mcp.ps1 | iex -Yes

"@
    exit 0
}

# Auto-accept mode
$AutoAccept = $Yes -or $Y

# Colors
$ColorBlue = "Cyan"
$ColorGreen = "Green"
$ColorYellow = "Yellow"
$ColorRed = "Red"

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor $ColorBlue
Write-Host "║                                                            ║" -ForegroundColor $ColorBlue
Write-Host "║        Browser MCP - Automatic Setup Utility              ║" -ForegroundColor $ColorBlue
Write-Host "║                      v4.0.0                                ║" -ForegroundColor $ColorBlue
Write-Host "║              WebSocket Architecture                        ║" -ForegroundColor $ColorBlue
Write-Host "║                                                            ║" -ForegroundColor $ColorBlue
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor $ColorBlue
Write-Host ""

# Detect if running from remote script
$IsRemoteScript = $MyInvocation.MyCommand.Path -eq $null

if ($IsRemoteScript) {
    Write-Host "⚠️  Running from remote script - cloning repository first..." -ForegroundColor $ColorYellow
    Write-Host ""

    # Clone to temp directory
    $TempDir = Join-Path $env:TEMP "browser-mcp-setup-$(Get-Random)"
    try {
        git clone https://github.com/YOLOVibeCode/browser-mcp.git $TempDir 2>&1 | Select-Object -Last 5
        if (-not (Test-Path $TempDir)) {
            throw "Clone failed"
        }
        Set-Location $TempDir
        $ProjectPath = $TempDir
        Write-Host "✅ Repository cloned" -ForegroundColor $ColorGreen
        Write-Host ""
    }
    catch {
        Write-Host "❌ Failed to clone repository" -ForegroundColor $ColorRed
        exit 1
    }
}
else {
    # Get absolute project path (script is in scripts/ subdirectory)
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $ProjectPath = Split-Path -Parent $ScriptDir
}

Write-Host "📍 Project location: $ProjectPath" -ForegroundColor $ColorBlue
Write-Host ""

# Detect OS
Write-Host "💻 Operating System: Windows" -ForegroundColor $ColorBlue
Write-Host ""

# Function to check if command exists
function Test-Command {
    param($Command)
    $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
}

# Check prerequisites
Write-Host "▶ Checking Prerequisites" -ForegroundColor $ColorGreen
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$MissingPrereqs = @()

# Check Node.js
if (Test-Command "node") {
    $NodeVersion = node --version
    Write-Host "   ✅ Node.js $NodeVersion" -ForegroundColor $ColorGreen
}
else {
    Write-Host "   ❌ Node.js not found" -ForegroundColor $ColorRed
    $MissingPrereqs += "node"
}

# Check npm
if (Test-Command "npm") {
    $NpmVersion = npm --version
    Write-Host "   ✅ npm v$NpmVersion" -ForegroundColor $ColorGreen
}
else {
    Write-Host "   ❌ npm not found" -ForegroundColor $ColorRed
    $MissingPrereqs += "npm"
}

# Check Git
if (Test-Command "git") {
    $GitVersion = git --version
    Write-Host "   ✅ Git $GitVersion" -ForegroundColor $ColorGreen
}
else {
    Write-Host "   ❌ Git not found" -ForegroundColor $ColorRed
    $MissingPrereqs += "git"
}

# Check Chrome
$ChromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
)

$ChromeFound = $false
foreach ($path in $ChromePaths) {
    if (Test-Path $path) {
        Write-Host "   ✅ Chrome detected" -ForegroundColor $ColorGreen
        $ChromeFound = $true
        break
    }
}

if (-not $ChromeFound) {
    Write-Host "   ⚠️  Chrome not detected" -ForegroundColor $ColorYellow
}

# Install missing prerequisites
if ($MissingPrereqs.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Missing prerequisites: $($MissingPrereqs -join ', ')" -ForegroundColor $ColorYellow
    Write-Host ""
    Write-Host "Please install:"

    if ($MissingPrereqs -contains "node" -or $MissingPrereqs -contains "npm") {
        Write-Host "  • Node.js: https://nodejs.org/ (includes npm)"
    }

    if ($MissingPrereqs -contains "git") {
        Write-Host "  • Git: https://git-scm.com/"
    }

    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "✅ All prerequisites satisfied" -ForegroundColor $ColorGreen
Write-Host ""

# Step 1: Install MCP Server from NPM
Write-Host "▶ Step 1: Installing Browser MCP Server" -ForegroundColor $ColorGreen
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$SkipNpmInstall = $false

# Check if already installed
if (Test-Command "browser-mcp-server") {
    try {
        $InstalledVersion = (npm list -g @rvegajr/browser-mcp-server --depth=0 2>$null | Select-String "browser-mcp-server" | ForEach-Object { $_ -replace '.*@(\d+\.\d+\.\d+).*', '$1' })
        Write-Host "   ⚠️  Browser MCP Server already installed (v$InstalledVersion)" -ForegroundColor $ColorYellow

        if ($AutoAccept) {
            Write-Host "   Auto-accepting: Reinstalling..." -ForegroundColor $ColorYellow
            $response = "y"
        }
        else {
            $response = Read-Host "   Reinstall? (y/n)"
        }

        if ($response -eq "y" -or $response -eq "Y") {
            Write-Host "   Uninstalling old version..." -ForegroundColor $ColorBlue
            npm uninstall -g @rvegajr/browser-mcp-server 2>&1 | Select-Object -Last 5
        }
        else {
            Write-Host "   ✅ Using existing installation" -ForegroundColor $ColorGreen
            Write-Host ""
            $SkipNpmInstall = $true
        }
    }
    catch {
        # If version check fails, proceed with install
    }
}

if (-not $SkipNpmInstall) {
    Write-Host "   Installing via NPM..." -ForegroundColor $ColorBlue

    # Install from NPM registry
    $result = npm install -g @rvegajr/browser-mcp-server 2>&1 | Select-Object -Last 5

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Browser MCP Server installed" -ForegroundColor $ColorGreen

        # Verify installation
        if (Test-Command "browser-mcp-server") {
            Write-Host "   ✅ Command 'browser-mcp-server' is available" -ForegroundColor $ColorGreen
        }
        else {
            Write-Host "   ⚠️  Command not found in PATH" -ForegroundColor $ColorYellow
            Write-Host "   You may need to restart your terminal" -ForegroundColor $ColorYellow
        }
    }
    else {
        Write-Host "   ❌ Installation failed" -ForegroundColor $ColorRed
        Write-Host "   Try manual install: npm install -g @rvegajr/browser-mcp-server" -ForegroundColor $ColorYellow
        exit 1
    }
}

Write-Host ""

# Step 2: Detect IDEs
Write-Host "▶ Step 2: Detecting IDEs" -ForegroundColor $ColorGreen
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$FoundIDEs = @()

# Check for Claude Desktop
$ClaudePath = "$env:APPDATA\Claude"
if (Test-Path $ClaudePath) {
    Write-Host "   ✅ Claude Desktop detected" -ForegroundColor $ColorGreen
    $FoundIDEs += "claude"
}

# Check for Cursor
$CursorPath = "$env:USERPROFILE\.cursor"
if (Test-Path $CursorPath) {
    Write-Host "   ✅ Cursor IDE detected" -ForegroundColor $ColorGreen
    $FoundIDEs += "cursor"
}

# Check for Windsurf
$WindsurfPath = "$env:USERPROFILE\.codeium\windsurf"
if (Test-Path $WindsurfPath) {
    Write-Host "   ✅ Windsurf IDE detected" -ForegroundColor $ColorGreen
    $FoundIDEs += "windsurf"
}

if ($FoundIDEs.Count -eq 0) {
    Write-Host "   ⚠️  No supported IDEs detected" -ForegroundColor $ColorYellow
    Write-Host "   Supported: Claude Desktop, Cursor, Windsurf" -ForegroundColor $ColorBlue
}

Write-Host ""

# Step 3: Configure IDEs
if ($FoundIDEs.Count -gt 0) {
    Write-Host "▶ Step 3: Configuring IDEs" -ForegroundColor $ColorGreen
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

    # Configure Claude Desktop
    if ($FoundIDEs -contains "claude") {
        Write-Host "Configuring Claude Desktop..." -ForegroundColor $ColorBlue
        $ConfigDir = "$env:APPDATA\Claude"
        $ConfigFile = "$ConfigDir\claude_desktop_config.json"

        New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null

        # Backup existing config
        if (Test-Path $ConfigFile) {
            $BackupFile = "$ConfigFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
            Copy-Item $ConfigFile $BackupFile
            Write-Host "   📦 Backed up existing config" -ForegroundColor $ColorYellow
        }

        # Create/update config
        $ConfigContent = @"
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-server"
    }
  }
}
"@
        Set-Content -Path $ConfigFile -Value $ConfigContent
        Write-Host "   ✅ Claude Desktop configured" -ForegroundColor $ColorGreen
        Write-Host ""
    }

    # Configure Cursor
    if ($FoundIDEs -contains "cursor") {
        Write-Host "Configuring Cursor IDE..." -ForegroundColor $ColorBlue
        $ConfigDir = "$env:USERPROFILE\.cursor"
        $ConfigFile = "$ConfigDir\mcp.json"

        New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null

        # Backup existing config
        if (Test-Path $ConfigFile) {
            $BackupFile = "$ConfigFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
            Copy-Item $ConfigFile $BackupFile
            Write-Host "   📦 Backed up existing config" -ForegroundColor $ColorYellow
        }

        # Create/update config
        $ConfigContent = @"
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-server"
    }
  }
}
"@
        Set-Content -Path $ConfigFile -Value $ConfigContent
        Write-Host "   ✅ Cursor IDE configured" -ForegroundColor $ColorGreen
        Write-Host ""
    }

    # Configure Windsurf
    if ($FoundIDEs -contains "windsurf") {
        Write-Host "Configuring Windsurf IDE..." -ForegroundColor $ColorBlue
        $ConfigDir = "$env:USERPROFILE\.codeium\windsurf"
        $ConfigFile = "$ConfigDir\mcp_config.json"

        New-Item -ItemType Directory -Force -Path $ConfigDir | Out-Null

        # Backup existing config
        if (Test-Path $ConfigFile) {
            $BackupFile = "$ConfigFile.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
            Copy-Item $ConfigFile $BackupFile
            Write-Host "   📦 Backed up existing config" -ForegroundColor $ColorYellow
        }

        # Create/update config
        $ConfigContent = @"
{
  "mcpServers": {
    "browser-mcp": {
      "command": "browser-mcp-server"
    }
  }
}
"@
        Set-Content -Path $ConfigFile -Value $ConfigContent
        Write-Host "   ✅ Windsurf IDE configured" -ForegroundColor $ColorGreen
        Write-Host ""
    }
}

# Step 4: Extension Installation
Write-Host "▶ Step 4: Chrome Extension" -ForegroundColor $ColorGreen
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

$ExtensionPath = Join-Path $ProjectPath "browser-mcp-extension"

Write-Host "   📦 Extension Location:" -ForegroundColor $ColorBlue
Write-Host "      $ExtensionPath"
Write-Host ""
Write-Host "   📋 To install (if not already installed):" -ForegroundColor $ColorYellow
Write-Host "      1. Open Chrome and go to: chrome://extensions/" -ForegroundColor $ColorBlue
Write-Host "      2. Enable 'Developer mode' (toggle in top-right)" -ForegroundColor $ColorBlue
Write-Host "      3. Click 'Load unpacked'" -ForegroundColor $ColorBlue
Write-Host "      4. Select folder: $ExtensionPath" -ForegroundColor $ColorBlue
Write-Host ""

# Try to copy to clipboard
try {
    Set-Clipboard -Value $ExtensionPath
    Write-Host "   ✅ Path copied to clipboard!" -ForegroundColor $ColorGreen
}
catch {
    # Clipboard failed, continue anyway
}

Write-Host ""

# Summary
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor $ColorBlue
Write-Host "║                                                            ║" -ForegroundColor $ColorBlue
Write-Host "║                   🎉 Setup Complete! 🎉                    ║" -ForegroundColor $ColorBlue
Write-Host "║                                                            ║" -ForegroundColor $ColorBlue
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor $ColorBlue
Write-Host ""

Write-Host "✅ What was installed:" -ForegroundColor $ColorGreen
Write-Host ""
Write-Host "  📦 MCP Server:"
Write-Host "     Command: browser-mcp-server" -ForegroundColor $ColorBlue
Write-Host "     Version: 4.0.0"
Write-Host "     Architecture: WebSocket (ws://localhost:8765)"
Write-Host ""

if ($FoundIDEs.Count -gt 0) {
    Write-Host "  📦 IDEs Configured:"
    foreach ($ide in $FoundIDEs) {
        Write-Host "     • $ide"
    }
    Write-Host ""
}

Write-Host "📋 Next Steps:" -ForegroundColor $ColorYellow
Write-Host ""
Write-Host "  1. Load Chrome Extension:" -ForegroundColor $ColorBlue
Write-Host "     • Open: chrome://extensions/" -ForegroundColor $ColorBlue
Write-Host "     • Enable 'Developer mode'"
Write-Host "     • Click 'Load unpacked'"
Write-Host "     • Select: $ExtensionPath" -ForegroundColor $ColorBlue
Write-Host ""
Write-Host "  2. Restart your IDE:" -ForegroundColor $ColorBlue
if ($FoundIDEs -contains "claude") {
    Write-Host "     • Claude Desktop: Close and reopen"
}
if ($FoundIDEs -contains "cursor") {
    Write-Host "     • Cursor: Close and reopen"
}
if ($FoundIDEs -contains "windsurf") {
    Write-Host "     • Windsurf: Close and reopen"
}
Write-Host ""
Write-Host "  3. Test in your IDE:" -ForegroundColor $ColorBlue
Write-Host "     Ask: 'What MCP servers are available?'" -ForegroundColor $ColorGreen
Write-Host "     Expected: 'browser-mcp' with 33 tools" -ForegroundColor $ColorGreen
Write-Host ""
Write-Host "  4. Use the tools:" -ForegroundColor $ColorBlue
Write-Host "     Ask: 'List all tabs in my browser'" -ForegroundColor $ColorGreen
Write-Host "     Ask: 'Get the DOM of the current page'" -ForegroundColor $ColorGreen
Write-Host "     Ask: 'Show me the console errors'" -ForegroundColor $ColorGreen
Write-Host ""

Write-Host "📚 Documentation:" -ForegroundColor $ColorGreen
Write-Host "  • Main README: $ProjectPath\README.md"
Write-Host "  • MCP Server: $ProjectPath\mcp-server\README.md"
Write-Host "  • Extension: $ProjectPath\browser-mcp-extension\README.md"
Write-Host ""

Write-Host "✨ Ready to expose browser state to AI! ✨" -ForegroundColor $ColorBlue
Write-Host ""
