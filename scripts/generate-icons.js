/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#18181b" />
      <stop offset="100%" stop-color="#09090b" />
    </linearGradient>
    <linearGradient id="accent" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f97316" />
      <stop offset="100%" stop-color="#ea580c" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="#ea580c" flood-opacity="0.5"/>
    </filter>
  </defs>
  
  <!-- Base Background -->
  <rect width="512" height="512" rx="112" fill="url(#bg)" />
  <rect width="504" height="504" x="4" y="4" rx="108" fill="none" stroke="#27272a" stroke-width="6" />

  <!-- Outer Ring Accent -->
  <circle cx="256" cy="256" r="180" fill="none" stroke="url(#accent)" stroke-width="12" stroke-dasharray="16 10" opacity="0.6"/>

  <!-- Motorcycle & Wrench Emblem -->
  <g transform="translate(64, 76)" filter="url(#glow)">
    <!-- Rear Wheel -->
    <circle cx="80" cy="240" r="48" fill="none" stroke="#f43f5e" stroke-width="18"/>
    <circle cx="80" cy="240" r="20" fill="#f43f5e"/>
    
    <!-- Front Wheel -->
    <circle cx="304" cy="240" r="48" fill="none" stroke="#f43f5e" stroke-width="18"/>
    <circle cx="304" cy="240" r="20" fill="#f43f5e"/>

    <!-- Motorcycle Frame -->
    <path d="M80 240 L160 230 L220 150 L280 150 M160 230 L180 170 L260 170 L304 240" 
          fill="none" stroke="#ffffff" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
    
    <!-- Fuel Tank / Body -->
    <path d="M170 160 Q210 120 250 150 Z" fill="url(#accent)"/>
    
    <!-- Handlebars -->
    <path d="M260 135 L285 115 M275 110 L295 120" stroke="#f97316" stroke-width="14" stroke-linecap="round"/>
    
    <!-- Seat -->
    <path d="M140 180 Q170 175 190 190" stroke="#a1a1aa" stroke-width="16" stroke-linecap="round"/>

    <!-- Speed Lines -->
    <line x1="20" y1="200" x2="45" y2="200" stroke="#f97316" stroke-width="6" stroke-linecap="round" opacity="0.8"/>
    <line x1="10" y1="225" x2="30" y2="225" stroke="#f97316" stroke-width="6" stroke-linecap="round" opacity="0.5"/>
  </g>

  <!-- Wrench Icon at Bottom Center -->
  <g transform="translate(256, 380) scale(0.9)">
    <path d="M-30 -10 L10 -50 L25 -35 L-15 5 Z" fill="#ffffff" opacity="0.9" />
    <circle cx="-32" cy="-8" r="14" fill="#09090b" stroke="#ffffff" stroke-width="6" />
    <circle cx="28" cy="-32" r="14" fill="#09090b" stroke="#ffffff" stroke-width="6" />
  </g>
</svg>`;

async function run() {
  const iconsDir = path.join(__dirname, '..', 'public', 'icons');
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }

  const svgPath = path.join(iconsDir, 'icon.svg');
  fs.writeFileSync(svgPath, svgIcon, 'utf8');
  console.log('Saved SVG icon to', svgPath);

  const svgBuffer = Buffer.from(svgIcon);

  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(iconsDir, 'icon-192x192.png'));
  console.log('Generated icon-192x192.png');

  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(iconsDir, 'icon-512x512.png'));
  console.log('Generated icon-512x512.png');

  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(iconsDir, 'apple-touch-icon.png'));
  console.log('Generated apple-touch-icon.png');

  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, '..', 'public', 'favicon.ico'));
  console.log('Generated favicon.ico');
}

run().catch(console.error);

