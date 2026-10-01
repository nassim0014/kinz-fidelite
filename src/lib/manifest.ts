import type { MetadataRoute } from 'next';

export function buildManifest(startUrl: string): MetadataRoute.Manifest {
  return {
    name: 'KINZ Fidélité',
    short_name: 'KINZ',
    description: 'Votre carte de fidélité KINZ',
    start_url: startUrl,
    scope: '/',
    display: 'standalone',
    background_color: '#F6F8EC',
    theme_color: '#20411E',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
