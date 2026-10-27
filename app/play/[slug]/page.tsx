import type { Metadata, Viewport } from 'next';
import { Shrikhand } from 'next/font/google';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { games } from '@/games';
import { accessCookie, canPlay, getGameSettings, toPublic } from '@/lib/minigame/settings';
import AccessGate from './AccessGate';
import PlayClient from './PlayClient';

// Police 70s des titres et des paroles projetées.
const display = Shrikhand({ subsets: ['latin'], weight: '400', display: 'swap' });

// Accès et réglages relus à chaque visite (mot de passe, sortie publique depuis l'admin).
export const dynamic = 'force-dynamic';

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const game = games[params.slug];
  if (!game) return {};
  const { title, artist } = game.config;
  const settings = await getGameSettings(params.slug);
  const open = settings.access === 'public';
  return {
    title: `${title} — le mini-jeu`,
    description: `Rapproche les ombres en ne bougeant que la lumière. Le mini-jeu de « ${title} » de ${artist}.`,
    alternates: { canonical: `/play/${params.slug}` },
    // Accès anticipé : jamais référencé ni suivi.
    robots: open ? undefined : { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  };
}

export const viewport: Viewport = {
  themeColor: '#001c35',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default async function PlayPage({ params }: Props) {
  const game = games[params.slug];
  if (!game) notFound();
  const settings = await getGameSettings(params.slug);
  const pub = toPublic(settings);
  if (!canPlay(settings, params.slug, cookies().get(accessCookie(params.slug))?.value)) {
    return (
      <AccessGate
        slug={params.slug}
        title={game.config.title}
        cover={pub.cover || game.config.assets.cover}
        releaseDate={pub.releaseDate}
        displayFont={display.style.fontFamily}
      />
    );
  }
  return <PlayClient slug={params.slug} displayFont={display.style.fontFamily} settings={pub} />;
}
