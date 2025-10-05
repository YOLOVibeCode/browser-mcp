#!/bin/bash
# Create simple colored square icons as placeholders

mkdir -p dist/icons

# Create 16x16 icon (red square)
convert -size 16x16 xc:'#0066cc' dist/icons/icon-16.png 2>/dev/null || \
  echo "ImageMagick not installed - icons need to be added manually"

# Create 48x48 icon (blue square)
convert -size 48x48 xc:'#0066cc' dist/icons/icon-48.png 2>/dev/null || true

# Create 128x128 icon (blue square)
convert -size 128x128 xc:'#0066cc' dist/icons/icon-128.png 2>/dev/null || true

echo "Icon generation attempted (requires ImageMagick)"
