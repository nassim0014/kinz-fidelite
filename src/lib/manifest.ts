import type { MetadataRoute } from 'next';

export function buildManifest(startUrl: string): MetadataRoute.Manifest {
  return {
    name: 'KINZ Fidélité',
    short_name: 'KINZ',
    description: 'Votre carte de fidélité KINZ',
    start_url: startUrl,
    scope: '/',
    display: 'standalone',
    background_color: '#F5F0E6',
    theme_color: '#4A5530',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
