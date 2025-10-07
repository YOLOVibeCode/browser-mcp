#!/bin/bash

# Package Browser MCP Extension for Distribution

set -e

echo "📦 Packaging Browser MCP Extension..."
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
EXTENSION_DIR="$PROJECT_ROOT/extension-chromium"
DIST_DIR="$EXTENSION_DIR/dist"
OUTPUT_DIR="$PROJECT_ROOT/releases"

# Create releases directory
mkdir -p "$OUTPUT_DIR"

# Get version from manifest
VERSION=$(grep '"version"' "$EXTENSION_DIR/manifest.json" | head -1 | sed 's/.*"version": "\(.*\)".*/\1/')
OUTPUT_FILE="$OUTPUT_DIR/browser-mcp-extension-v$VERSION.zip"

echo "→ Version: $VERSION"
echo "→ Source: $DIST_DIR"
echo "→ Output: $OUTPUT_FILE"
echo ""

# Build extension first
echo "→ Building extension..."
cd "$EXTENSION_DIR"
npm run build > /dev/null 2>&1
echo "  ✓ Built"

# Create zip file
echo "→ Creating zip archive..."
cd "$DIST_DIR"
zip -r "$OUTPUT_FILE" . -x "*.DS_Store" > /dev/null 2>&1
echo "  ✓ Packaged"

# Get file size
SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Extension packaged successfully!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "File: $OUTPUT_FILE"
echo "Size: $SIZE"
echo ""
echo "Upload this file to GitHub Releases:"
echo "  https://github.com/YOLOVibeCode/browser-mcp/releases"
echo ""
