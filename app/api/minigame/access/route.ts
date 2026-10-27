import { NextResponse, type NextRequest } from 'next/server';
import { games } from '@/games';
import { accessCookie, accessToken, getGameSettings, sameString } from '@/lib/minigame/settings';

/**
 * Accès anticipé : POST { slug, password } → cookie httpOnly valable 60 jours.
 * 8 essais / 10 min / IP (mémoire de l'instance : simple frein aux essais en rafale).
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const tries = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const MAX_TRIES = 8;

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || 'local';
  const now = Date.now();
  const recent = (tries.get(ip) ?? []).filter((t) => now - t < WINDOW);
  if (recent.length >= MAX_TRIES) return NextResponse.json({ ok: false, error: 'too_many' }, { status: 429 });
  recent.push(now);
  tries.set(ip, recent);
  if (tries.size > 5000) tries.clear();

  let body: { slug?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }
  const slug = String(body.slug ?? '');
  if (!games[slug]) return NextResponse.json({ ok: false }, { status: 404 });
  const settings = await getGameSettings(slug);
  if (settings.access === 'public') return NextResponse.json({ ok: true });

  const password = String(body.password ?? '').trim();
  const token = accessToken(slug, settings.password);
  if (!token || !password || !sameString(password, settings.password.trim()))
    return NextResponse.json({ ok: false, error: 'wrong' }, { status: 401 });

  const res = NextResponse.json({ ok: true });
  res.cookies.set(accessCookie(slug), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 24 * 3600,
  });
  return res;
}
