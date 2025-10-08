# Browser MCP Icons

## Quick Icon Creation

To create icons for the extension, you can:

1. **Use online tool**: https://www.favicon-generator.org/
   - Upload a logo or create one
   - Download 16x16, 48x48, and 128x128 PNG files

2. **Use ImageMagick** (if installed):
   ```bash
   # Create a simple placeholder
   convert -size 128x128 xc:blue -fill white -pointsize 60 -gravity center \
     -annotate +0+0 "MCP" icon-128.png
   
   convert icon-128.png -resize 48x48 icon-48.png
   convert icon-128.png -resize 16x16 icon-16.png
   ```

3. **Use the browser** to screenshot the popup logo emoji:
   - Just use the 🌐 emoji as temporary icons

## Required Files

- `icon-16.png` (16x16 pixels)
- `icon-48.png` (48x48 pixels)
- `icon-128.png` (128x128 pixels)

## Temporary Workaround

For testing, you can comment out the icons in `manifest.json` temporarily.

