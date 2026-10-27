import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse, type NextRequest } from 'next/server';
import { games } from '@/games';
import { accessCookie, canPlay, getGameSettings } from '@/lib/minigame/settings';

/**
 * Stems audio d'un mini-jeu (games/<slug>/media/*.m4a), servis seulement aux
 * visiteurs qui ont accès au jeu : tant qu'il est en accès anticipé, la musique
 * (pas encore sortie) n'est pas téléchargeable par simple URL.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const FILE = /^[a-z0-9-]+\.m4a$/;

export async function GET(req: NextRequest, { params }: { params: { slug: string; file: string } }) {
  const { slug, file } = params;
  if (!games[slug] || !FILE.test(file)) return new NextResponse(null, { status: 404 });
  const settings = await getGameSettings(slug);
  if (!canPlay(settings, slug, req.cookies.get(accessCookie(slug))?.value))
    return new NextResponse(null, { status: 403 });
  try {
    const data = await readFile(path.join(process.cwd(), 'games', slug, 'media', file));
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'audio/mp4',
        'Content-Length': String(data.length),
        // Cache navigateur seulement (jamais de CDN partagé tant que l'accès est privé).
        'Cache-Control': settings.access === 'public' ? 'public, max-age=86400' : 'private, max-age=86400',
      },
    });
  } catch {
    return new NextResponse(null, { status: 404 });
  }
}
