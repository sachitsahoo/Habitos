// Run with: node scripts/generate-icons.mjs
// Requires: pnpm add -D sharp

import sharp from 'sharp';
import { writeFileSync } from 'fs';

const sizes = [192, 512];

const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="#6B9B8C"/>
  <text
    x="50%" y="54%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="Inter, system-ui, sans-serif"
    font-weight="700"
    font-size="${size * 0.52}"
    fill="white"
  >a</text>
</svg>`;

for (const size of sizes) {
  await sharp(Buffer.from(svg(size)))
    .png()
    .toFile(`public/pwa-${size}x${size}.png`);
  console.log(`Generated public/pwa-${size}x${size}.png`);
}

// Apple touch icon (180x180, no rounded corners — iOS applies its own mask)
const appleSize = 180;
const appleSvg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${appleSize}" height="${appleSize}" viewBox="0 0 ${appleSize} ${appleSize}">
  <rect width="${appleSize}" height="${appleSize}" fill="#6B9B8C"/>
  <text
    x="50%" y="54%"
    dominant-baseline="middle"
    text-anchor="middle"
    font-family="Inter, system-ui, sans-serif"
    font-weight="700"
    font-size="${appleSize * 0.52}"
    fill="white"
  >a</text>
</svg>`;

await sharp(Buffer.from(appleSvg))
  .png()
  .toFile('public/apple-touch-icon.png');
console.log('Generated public/apple-touch-icon.png');
