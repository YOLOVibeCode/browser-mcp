# 🎨 Icon Generation Instructions

## Quick Method (2 minutes)

### Option 1: Use the HTML Generator (Recommended)

1. **Open the generator:**
   ```bash
   open create-icons.html
   ```
   (Or double-click `create-icons.html` in Finder)

2. **Icons will be displayed automatically**

3. **Download all icons:**
   - Click the "Download All Icons" button
   - Or right-click each icon and "Save Image As..."
   - Save as: `icon-16.png`, `icon-48.png`, `icon-128.png`

4. **Move to icons folder:**
   - Save the downloaded files directly to this `icons/` folder
   - Replace any existing files

5. **Reload extension:**
   - Go to `chrome://extensions/`
   - Click "Reload" on the Browser MCP extension
   - ✅ Icons should now appear!

---

## Alternative Methods

### Option 2: Convert SVG using Online Tool

1. Go to: https://svgtopng.com/
2. Upload each SVG file (icon-16.svg, icon-48.svg, icon-128.svg)
3. Download as PNG
4. Save to this folder

### Option 3: macOS Preview

1. Open each SVG file in Preview
2. File → Export
3. Format: PNG
4. Save with same name (but .png extension)

### Option 4: Install ImageMagick

```bash
brew install imagemagick
brew install librsvg

# Then convert
rsvg-convert -w 16 -h 16 icon-16.svg > icon-16.png
rsvg-convert -w 48 -h 48 icon-48.svg > icon-48.png
rsvg-convert -w 128 -h 128 icon-128.svg > icon-128.png
```

---

## What the Icons Look Like

- **Purple gradient background** (#667eea to #764ba2)
- **Large white "M"** in the center (for MCP)
- **Green badge** with "33" (for 33 tools) on 48px and 128px versions
- **Rounded corners** for modern appearance

---

## Troubleshooting

**"Couldn't load icon" error?**
- Make sure PNG files exist in the icons/ folder
- File names must be exactly: `icon-16.png`, `icon-48.png`, `icon-128.png`
- Reload the extension in Chrome after adding files

**Icons look blurry?**
- Make sure each icon is the correct size (16x16, 48x48, 128x128 pixels)
- Don't scale images; use the exact dimensions

**Want different icons?**
- Edit the `create-icons.html` file
- Modify the `drawIcon()` function
- Change colors, text, or design as needed

---

## Quick Test

After creating the PNG files, verify they exist:

```bash
ls -la *.png
```

Should show:
- icon-16.png
- icon-48.png
- icon-128.png

Then reload the extension and the error should be gone! ✅

