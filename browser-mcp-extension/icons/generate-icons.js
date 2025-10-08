#!/usr/bin/env node

/**
 * Generate Browser MCP Icons
 * Creates PNG icons using node-canvas (if available) or provides instructions
 */

const fs = require('fs');
const path = require('path');

console.log('🎨 Browser MCP Icon Generator\n');

// Check if canvas is available
let Canvas;
try {
    Canvas = require('canvas');
} catch (e) {
    console.log('📦 node-canvas not installed. Using alternative method...\n');
    generateFallbackIcons();
    process.exit(0);
}

function drawIcon(size) {
    const canvas = Canvas.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    
    // Background - gradient effect (approximate with solid color)
    const gradient = ctx.createLinearGradient(0, 0, size, size);
    gradient.addColorStop(0, '#667eea');
    gradient.addColorStop(1, '#764ba2');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
    
    // Round corners
    ctx.globalCompositeOperation = 'destination-in';
    const cornerRadius = size * 0.2;
    ctx.beginPath();
    ctx.moveTo(cornerRadius, 0);
    ctx.lineTo(size - cornerRadius, 0);
    ctx.quadraticCurveTo(size, 0, size, cornerRadius);
    ctx.lineTo(size, size - cornerRadius);
    ctx.quadraticCurveTo(size, size, size - cornerRadius, size);
    ctx.lineTo(cornerRadius, size);
    ctx.quadraticCurveTo(0, size, 0, size - cornerRadius);
    ctx.lineTo(0, cornerRadius);
    ctx.quadraticCurveTo(0, 0, cornerRadius, 0);
    ctx.closePath();
    ctx.fill();
    
    ctx.globalCompositeOperation = 'source-over';
    
    // Draw "M" letter
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${size * 0.6}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', size / 2, size / 2);
    
    // Add badge for larger sizes
    if (size >= 48) {
        const badgeSize = size * 0.3;
        const badgeX = size * 0.75;
        const badgeY = size * 0.25;
        
        ctx.beginPath();
        ctx.arc(badgeX, badgeY, badgeSize / 2, 0, 2 * Math.PI);
        ctx.fillStyle = '#4CAF50';
        ctx.fill();
        
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${size * 0.12}px Arial`;
        ctx.fillText('33', badgeX, badgeY);
    }
    
    return canvas;
}

function generateFallbackIcons() {
    console.log('Alternative Methods to Create Icons:\n');
    
    console.log('Option 1: Use the HTML Generator');
    console.log('  1. Open: icons/create-icons.html in your browser');
    console.log('  2. Click "Download All Icons"');
    console.log('  3. Save files to the icons/ folder\n');
    
    console.log('Option 2: Use ImageMagick (if installed)');
    console.log('  brew install imagemagick');
    console.log('  Then run:');
    console.log('    convert -size 16x16 xc:"#667eea" -fill white -font Arial-Bold');
    console.log('    -pointsize 10 -gravity center -annotate +0+0 "M" icon-16.png\n');
    
    console.log('Option 3: Use online tool');
    console.log('  - Visit: https://www.favicon-generator.org/');
    console.log('  - Upload any image with "M" text');
    console.log('  - Download 16x16, 48x48, 128x128 sizes\n');
    
    console.log('Option 4: Simple colored squares (temporary)');
    console.log('  Creating simple placeholder icons...\n');
    
    createSimplePlaceholders();
}

function createSimplePlaceholders() {
    // Create simple SVG placeholders that Chrome can use
    const sizes = [16, 48, 128];
    
    sizes.forEach(size => {
        const svg = `
<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#667eea;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#764ba2;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#grad)"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.6}" font-weight="bold" 
        fill="white" text-anchor="middle" dominant-baseline="central">M</text>
  ${size >= 48 ? `
  <circle cx="${size * 0.75}" cy="${size * 0.25}" r="${size * 0.15}" fill="#4CAF50"/>
  <text x="${size * 0.75}" y="${size * 0.25}" font-family="Arial" font-size="${size * 0.12}" 
        font-weight="bold" fill="white" text-anchor="middle" dominant-baseline="central">33</text>
  ` : ''}
</svg>`;
        
        const filename = path.join(__dirname, `icon-${size}.svg`);
        fs.writeFileSync(filename, svg.trim());
        console.log(`✅ Created: icon-${size}.svg`);
    });
    
    console.log('\n⚠️  Note: Chrome extensions need PNG files.');
    console.log('Convert SVG to PNG using:');
    console.log('  - Online: https://svgtopng.com/');
    console.log('  - macOS: Open SVG in Preview, Export as PNG');
    console.log('  - Command: brew install librsvg && rsvg-convert icon.svg > icon.png\n');
}

// Try to generate PNG icons
try {
    const sizes = [16, 48, 128];
    
    sizes.forEach(size => {
        const canvas = drawIcon(size);
        const buffer = canvas.toBuffer('image/png');
        const filename = path.join(__dirname, `icon-${size}.png`);
        fs.writeFileSync(filename, buffer);
        console.log(`✅ Created: icon-${size}.png`);
    });
    
    console.log('\n🎉 All icons generated successfully!');
    console.log('Icons saved to:', __dirname);
    
} catch (error) {
    console.error('Error generating PNG icons:', error.message);
    console.log('\nFalling back to alternative methods...\n');
    generateFallbackIcons();
}

