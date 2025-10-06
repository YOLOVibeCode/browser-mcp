#!/bin/bash

# Browser MCP Native Host Setup Script
# This script installs the native messaging host for automatic config writing

set -e

echo "🌐 Browser MCP Native Messaging Host Setup"
echo "=========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js found: $(node --version)"
echo ""

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📁 Installing from: $SCRIPT_DIR"
echo ""

# Check if extension ID is provided
if [ -z "$1" ]; then
    echo "⚠️  No extension ID provided. Using placeholder."
    echo ""
    echo "To complete installation:"
    echo "1. Load the extension in Chrome (chrome://extensions/)"
    echo "2. Enable Developer Mode"
    echo "3. Copy the Extension ID"
    echo "4. Run: ./setup.sh <EXTENSION_ID>"
    echo ""
    node install.js
else
    echo "🔑 Using Extension ID: $1"
    echo ""
    node install.js "$1"
fi

echo ""
echo "=========================================="
echo "✅ Setup complete!"
echo ""
echo "The native host is now installed and ready to:"
echo "  • Write config files automatically"
echo "  • Create directories as needed"
echo "  • Merge with existing configs"
echo ""
echo "Try the Chrome extension setup wizard now!"
echo "=========================================="
