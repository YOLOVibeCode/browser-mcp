#!/usr/bin/env python3
"""
Browser MCP Icon Generator
Creates PNG icons using PIL (Python Imaging Library)
"""

try:
    from PIL import Image, ImageDraw, ImageFont
    import os
except ImportError:
    print("❌ PIL not installed. Install with: pip3 install pillow")
    print("\nOr use the HTML generator: open create-icons.html")
    exit(1)

def create_icon(size):
    """Create an icon of the specified size"""
    
    # Create image with gradient background (approximate with solid color)
    img = Image.new('RGBA', (size, size), (102, 126, 234, 255))
    draw = ImageDraw.Draw(img)
    
    # Draw gradient effect (top to bottom)
    for y in range(size):
        ratio = y / size
        r = int(102 + (118 - 102) * ratio)
        g = int(126 + (75 - 126) * ratio)
        b = int(234 + (162 - 234) * ratio)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    
    # Draw rounded rectangle mask
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    corner_radius = int(size * 0.2)
    mask_draw.rounded_rectangle(
        [(0, 0), (size, size)],
        corner_radius,
        fill=255
    )
    
    # Apply mask
    img.putalpha(mask)
    
    # Draw "M" text
    try:
        # Try to use a bold font
        font_size = int(size * 0.6)
        try:
            font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
        except:
            font = ImageFont.load_default()
    except:
        font = ImageFont.load_default()
    
    text = "M"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    text_x = (size - text_width) // 2
    text_y = (size - text_height) // 2 - bbox[1]
    
    draw.text((text_x, text_y), text, fill=(255, 255, 255, 255), font=font)
    
    # Add badge for larger sizes
    if size >= 48:
        badge_size = int(size * 0.3)
        badge_x = int(size * 0.75)
        badge_y = int(size * 0.25)
        
        # Draw green circle
        draw.ellipse(
            [(badge_x - badge_size//2, badge_y - badge_size//2),
             (badge_x + badge_size//2, badge_y + badge_size//2)],
            fill=(76, 175, 80, 255)
        )
        
        # Draw "33" text
        badge_font_size = int(size * 0.12)
        try:
            badge_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", badge_font_size)
        except:
            badge_font = ImageFont.load_default()
        
        badge_text = "33"
        badge_bbox = draw.textbbox((0, 0), badge_text, font=badge_font)
        badge_text_width = badge_bbox[2] - badge_bbox[0]
        badge_text_height = badge_bbox[3] - badge_bbox[1]
        badge_text_x = badge_x - (badge_text_width // 2 if badge_text_width > 0 else 0)
        badge_text_y = badge_y - (badge_text_height // 2 if badge_text_height > 0 else 0) - badge_bbox[1]
        
        draw.text((badge_text_x, badge_text_y), badge_text, 
                 fill=(255, 255, 255, 255), font=badge_font)
    
    return img

def main():
    print("🎨 Browser MCP Icon Generator\n")
    
    sizes = [16, 48, 128]
    script_dir = os.path.dirname(os.path.abspath(__file__))
    
    for size in sizes:
        try:
            img = create_icon(size)
            filename = os.path.join(script_dir, f'icon-{size}.png')
            img.save(filename, 'PNG')
            print(f"✅ Created: icon-{size}.png")
        except Exception as e:
            print(f"❌ Error creating icon-{size}.png: {e}")
    
    print("\n🎉 All icons generated successfully!")
    print(f"Icons saved to: {script_dir}")
    print("\nNext steps:")
    print("1. Reload your extension in chrome://extensions/")
    print("2. Icons should now appear correctly!")

if __name__ == "__main__":
    main()

