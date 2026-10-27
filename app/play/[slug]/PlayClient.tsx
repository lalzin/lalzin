'use client';

import dynamic from 'next/dynamic';
import type { PublicGameSettings } from '@/lib/minigame/publicSettings';

// Le jeu (Pixi, WebGL, Web Audio) ne tourne que côté client.
const GameShell = dynamic(() => import('@/components/minigame/GameShell'), {
  ssr: false,
  loading: () => <div className="fixed inset-0 bg-[#001c35]" />,
});

export default function PlayClient({
  slug,
  displayFont,
  settings,
}: {
  slug: string;
  displayFont: string;
  settings: PublicGameSettings;
}) {
  return <GameShell slug={slug} displayFont={displayFont} settings={settings} />;
}
