import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'KINZ Fidélité',
    short_name: 'KINZ',
    description: 'Votre carte de fidélité KINZ',
    start_url: '/rejoindre',
    display: 'standalone',
    background_color: '#F5F0E6',
    theme_color: '#4A5530',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
