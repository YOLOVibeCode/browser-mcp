#!/bin/bash

# Browser MCP Native Messaging Host Installer - macOS
# Optimized version with compression support

set -e

echo "Installing Browser MCP Native Messaging Host (Optimized)..."

# Get extension ID from user
read -p "Enter your Chrome extension ID: " EXTENSION_ID

if [ -z "$EXTENSION_ID" ]; then
    echo "Error: Extension ID required"
    exit 1
fi

# Install host script
echo "Installing host script..."
sudo cp host-optimized.js /usr/local/bin/browser-mcp-host
sudo chmod +x /usr/local/bin/browser-mcp-host

# Update manifest with extension ID
echo "Creating manifest..."
MANIFEST_DIR="$HOME/Library/Application Support/Google/Chrome/NativeMessagingHosts"
mkdir -p "$MANIFEST_DIR"

cat manifest-mac.json | sed "s/EXTENSION_ID_HERE/$EXTENSION_ID/g" > "$MANIFEST_DIR/com.browsermcp.native.json"

echo "✓ Installation complete!"
echo ""
echo "Native Messaging Host installed at: /usr/local/bin/browser-mcp-host"
echo "Manifest installed at: $MANIFEST_DIR/com.browsermcp.native.json"
echo ""
echo "Optimizations enabled:"
echo "  - Gzip compression for large messages"
echo "  - Streaming I/O"
echo "  - Message batching"
echo ""
echo "Next steps:"
echo "1. Reload your Chrome extension"
echo "2. Configure Claude Desktop or Cursor IDE"
echo "3. Test connection with: echo '{\"method\":\"initialize\"}' | browser-mcp-host"

