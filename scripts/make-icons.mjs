import { readFileSync } from 'node:fs';
import sharp from 'sharp';

// Forest green tile, pale green wordmark. Full bleed so no white band shows on home screens.
const forest = '#20411e';
const lime = '#e7f3ad';
const wordmark = readFileSync('assets/brand/kinz-wordmark.svg', 'utf8');
const paths = [...wordmark.matchAll(/d="([^"]+)"/g)].map((m) => m[1]);

// Wordmark is 540 x 169 in its own coordinates (origin 293, 297). Fit it to 66% of the tile,
// inside the maskable safe zone.
function iconSvg(size) {
  const w = size * 0.66;
  const scale = w / 540;
  const h = 169 * scale;
  const tx = (size - w) / 2 - 293 * scale;
  const ty = (size - h) / 2 - 297 * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="100%" height="100%" fill="${forest}"/>
  <g transform="translate(${tx} ${ty}) scale(${scale})" fill="${lime}">
    ${paths.map((d) => `<path d="${d}"/>`).join('')}
  </g>
</svg>`;
}

for (const [size, out] of [
  [192, 'public/icon-192.png'],
  [512, 'public/icon-512.png'],
  [180, 'public/apple-touch-icon.png'],
  [64, 'src/app/icon.png'],
]) {
  await sharp(Buffer.from(iconSvg(size)))
    .png()
    .toFile(out);
}
console.log('Icônes générées');
