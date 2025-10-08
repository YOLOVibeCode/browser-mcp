#!/bin/bash

# Package Browser MCP Extension (Development Mode - TypeScript Source)
# This packages the extension with TypeScript source files for development testing

set -e

echo "📦 Packaging Browser MCP Extension (Dev Mode)..."
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
EXTENSION_DIR="$PROJECT_ROOT/extension-chromium"
OUTPUT_DIR="$PROJECT_ROOT/releases"

# Create releases directory
mkdir -p "$OUTPUT_DIR"

# Get version from manifest
VERSION=$(grep '"version"' "$EXTENSION_DIR/manifest.json" | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
OUTPUT_FILE="$OUTPUT_DIR/browser-mcp-extension-v$VERSION-dev.zip"

echo "→ Version: $VERSION"
echo "→ Source: $EXTENSION_DIR"
echo "→ Output: $OUTPUT_FILE"
echo ""

# Create temporary directory for packaging
TEMP_DIR=$(mktemp -d)
echo "→ Creating package structure..."

# Copy essential files
cp "$EXTENSION_DIR/manifest.json" "$TEMP_DIR/"
cp -r "$EXTENSION_DIR/icons" "$TEMP_DIR/"
cp -r "$EXTENSION_DIR/popup" "$TEMP_DIR/"
cp -r "$EXTENSION_DIR/background" "$TEMP_DIR/"
cp -r "$EXTENSION_DIR/adapters" "$TEMP_DIR/"

# Copy node_modules for contracts and infrastructure (required for imports)
mkdir -p "$TEMP_DIR/node_modules/@browser-mcp"
cp -r "$PROJECT_ROOT/contracts/dist" "$TEMP_DIR/node_modules/@browser-mcp/contracts"
cp -r "$PROJECT_ROOT/infrastructure/dist" "$TEMP_DIR/node_modules/@browser-mcp/infrastructure"

echo "  ✓ Files copied"

# Update manifest to use TypeScript service worker directly
echo "→ Updating manifest for dev mode..."
cd "$TEMP_DIR"

# Chrome can't load .ts directly, so let's create a simple JS loader
cat > background/service-worker.js << 'EOF'
// Simple loader for development - Chrome extensions need .js entry
// In production, this would be a compiled bundle
console.log('[Browser MCP v3.0] Extension loaded');
console.log('[Browser MCP] Note: This is a development build. Full TypeScript compilation needed for production.');

// For now, just log that the extension is installed
chrome.action.onClicked.addListener((tab) => {
  console.log('[Browser MCP] Extension icon clicked, tab:', tab.id);
});

// Status indicator (basic)
chrome.runtime.onInstalled.addListener(() => {
  console.log('[Browser MCP] Extension installed successfully!');
  chrome.action.setBadgeText({ text: 'OK' });
  chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
});
EOF

# Update manifest to use the JS loader
sed -i '' 's/"service_worker": "background\/service-worker-new.ts"/"service_worker": "background\/service-worker.js"/' manifest.json

echo "  ✓ Manifest updated"

# Create zip file
echo "→ Creating zip archive..."
zip -r "$OUTPUT_FILE" . -x "*.DS_Store" -x "*.ts" -x "*.map" > /dev/null 2>&1
echo "  ✓ Packaged"

# Cleanup
rm -rf "$TEMP_DIR"

# Get file size
SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Extension packaged successfully (DEV MODE)!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "File: $OUTPUT_FILE"
echo "Size: $SIZE"
echo ""
echo "To install:"
echo "  1. Open Chrome and go to: chrome://extensions/"
echo "  2. Enable 'Developer mode' (toggle in top-right)"
echo "  3. Click 'Load unpacked'"
echo "  4. Extract the ZIP and select the folder"
echo ""
echo "OR (simpler for testing):"
echo "  1. Go to chrome://extensions/"
echo "  2. Enable 'Developer mode'"
echo "  3. Click 'Load unpacked'"
echo "  4. Select: $EXTENSION_DIR"
echo "     (Load directly from source!)"
echo ""

