import sharp from 'sharp';

const src = 'assets/logo.png';
const bg = '#F5F0E6';
for (const [size, out] of [
  [192, 'public/icon-192.png'],
  [512, 'public/icon-512.png'],
  [180, 'public/apple-touch-icon.png'],
  [64, 'src/app/icon.png'],
]) {
  await sharp(src).resize(size, size, { fit: 'contain', background: bg }).png().toFile(out);
}
console.log('Icônes générées');
