import type { MetadataRoute } from 'next';
import { defaultContent } from '@/lib/content';

export default function manifest(): MetadataRoute.Manifest {
  const { artist, site } = defaultContent;
  return {
    name: `${artist.name} — DJ & Producer`,
    short_name: artist.name,
    description: site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#160912',
    theme_color: '#160912',
    lang: 'fr',
    categories: ['music', 'entertainment'],
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
