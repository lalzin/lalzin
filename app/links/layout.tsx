import type { Metadata } from 'next';
import { defaultContent } from '@/lib/content';

const { artist } = defaultContent;

export const metadata: Metadata = {
  title: 'Liens',
  description: `Tous les liens de ${artist.name} : Spotify, Instagram, Apple Music, YouTube, SoundCloud, sorties & booking.`,
  alternates: { canonical: '/links' },
  openGraph: {
    title: `${artist.name} — Liens`,
    description: `Retrouve ${artist.name} sur toutes les plateformes.`,
    url: `${defaultContent.site.url}/links`,
    images: ['/og.jpg'],
  },
};

export default function LinksLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
