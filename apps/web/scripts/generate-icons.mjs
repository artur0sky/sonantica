/**
 * Simple icon generator for Sonántica PWA
 * Creates basic PNG icons from SVG
 * 
 * For production, use professional icon generation tools.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const sizes = [192, 512];
const publicDir = join(process.cwd(), 'public');

console.log('📱 Generating PWA icons...\n');

// Read the SVG
const svgPath = join(publicDir, 'icon.svg');
const svgContent = readFileSync(svgPath, 'utf-8');

console.log('⚠️  Note: This script creates basic placeholder icons.');
console.log('   For production, use proper icon generation tools.\n');

// Create a simple HTML file that can be used to generate screenshots
const htmlTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { margin: 0; padding: 0; background: #0f172a; }
    .icon-container { 
      width: SIZE_PLACEHOLDERpx; 
      height: SIZE_PLACEHOLDERpx; 
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg { width: 100%; height: 100%; }
  </style>
</head>
<body>
  <div class="icon-container">
    ${svgContent}
  </div>
</body>
</html>
`;

// Generate HTML files for each size
sizes.forEach(size => {
    const html = htmlTemplate.replace(/SIZE_PLACEHOLDER/g, size.toString());
    const htmlPath = join(publicDir, `icon-${size}.html`);
    writeFileSync(htmlPath, html);
    console.log(`✓ Created icon-${size}.html`);
});

// Also create the maskable version
const maskableHtml = htmlTemplate.replace(/SIZE_PLACEHOLDER/g, '512');
const maskablePath = join(publicDir, 'icon-maskable.html');
writeFileSync(maskablePath, maskableHtml);
console.log('✓ Created icon-maskable.html\n');

console.log('📋 Next steps:');
console.log('1. Open each HTML file in a browser');
console.log('2. Take a screenshot or use browser dev tools to export as PNG');
console.log('3. Save as icon-192.png, icon-512.png, and icon-maskable.png');
console.log('\nOr use an online tool like https://realfavicongenerator.net/\n');
