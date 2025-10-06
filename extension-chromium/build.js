import esbuild from 'esbuild';
import { copyFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';

/**
 * Build script for Chrome extension
 * Bundles service worker and popup with all dependencies
 */

async function build() {
  console.log('🚀 Building Browser Inspector Extension...\n');

  // Create dist directory
  if (!existsSync('dist')) {
    await mkdir('dist', { recursive: true });
    await mkdir('dist/icons', { recursive: true });
  }

  try {
    // Bundle service worker
    console.log('📦 Bundling service worker...');
    await esbuild.build({
      entryPoints: ['background/service-worker.ts'],
      bundle: true,
      platform: 'browser',
      target: 'es2020',
      outfile: 'dist/background/service-worker.js',
      format: 'esm',
      sourcemap: true,
      external: ['chrome'],
    });
    console.log('✅ Service worker bundled\n');

    // Bundle popup
    console.log('📦 Bundling popup...');
    await esbuild.build({
      entryPoints: ['popup/popup.ts'],
      bundle: true,
      platform: 'browser',
      target: 'es2020',
      outfile: 'dist/popup/popup.js',
      format: 'esm',
      sourcemap: true,
      external: ['chrome'],
    });
    console.log('✅ Popup bundled\n');

    // Copy static files
    console.log('📋 Copying static files...');
    await copyFile('manifest.json', 'dist/manifest.json');
    await copyFile('popup/popup.html', 'dist/popup/popup.html');
    await copyFile('popup/test-popup.html', 'dist/popup/test-popup.html');
    await copyFile('popup/test-popup.js', 'dist/popup/test-popup.js');
    await copyFile('popup/setup-guide.html', 'dist/popup/setup-guide.html');
    await copyFile('popup/setup-guide.js', 'dist/popup/setup-guide.js');
    console.log('✅ Static files copied\n');

    // Note about icons
    console.log('ℹ️  Note: Icon files need to be added manually to dist/icons/\n');

    console.log('✨ Build complete! Extension ready at: dist/\n');
    console.log('To load in Chrome:');
    console.log('  1. Open chrome://extensions/');
    console.log('  2. Enable "Developer mode"');
    console.log('  3. Click "Load unpacked"');
    console.log('  4. Select the dist/ folder\n');
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

build();
