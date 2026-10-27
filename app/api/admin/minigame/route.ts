/**
 * GET  /api/admin/minigame?slug=…  → réglages de sortie + classements avec e-mails
 * POST /api/admin/minigame         → enregistre les réglages d'un jeu
 * Admin authentifié requis (même session que le reste de /admin).
 */
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SESSION_COOKIE, verifyToken } from '@/lib/auth';
import { games } from '@/games';
import { supabaseConfigured, supabaseServer } from '@/lib/supabase';
import {
  getGameSettings,
  parisDayRange,
  parisToday,
  saveGameSettings,
  type GameSettings,
} from '@/lib/minigame/settings';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const unauthorized = () => NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 });

type Row = { pseudo: string; score: number; levels: number; created_at: string; email: string | null };

/** Top 10 avec e-mails (admin seulement). `day` = journée à Paris. */
async function board(slug: string, day?: string): Promise<{ rows: Row[]; error?: string }> {
  const db = supabaseServer();
  if (!db) return { rows: [] };
  let q = db.from('minigame_scores').select('pseudo, score, levels, created_at, email').eq('slug', slug);
  if (day) {
    const [from, to] = parisDayRange(day);
    q = q.gte('created_at', from).lt('created_at', to);
  }
  const { data, error } = await q.order('score', { ascending: false }).order('created_at').limit(10);
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as Row[] };
}

export async function GET(req: Request) {
  if (!(await verifyToken(cookies().get(SESSION_COOKIE)?.value))) return unauthorized();
  const slug = new URL(req.url).searchParams.get('slug') || Object.keys(games)[0];
  const game = games[slug];
  if (!game) return NextResponse.json({ ok: false, error: 'Jeu inconnu' }, { status: 404 });

  const settings = await getGameSettings(slug);
  const today = parisToday();
  const [all, ofToday, ofRelease] = await Promise.all([
    board(slug),
    board(slug, today),
    settings.releaseDate ? board(slug, settings.releaseDate) : Promise.resolve(null),
  ]);
  return NextResponse.json({
    ok: true,
    games: Object.entries(games).map(([s, g]) => ({ slug: s, title: g.config.title })),
    slug,
    defaults: { cover: game.config.assets.cover, links: game.config.links },
    settings,
    today,
    boards: { all: all.rows, today: ofToday.rows, release: ofRelease?.rows ?? null },
    // Message d'erreur SQL (ex. colonne email absente → relancer supabase/minigame.sql).
    boardError: all.error ?? null,
    services: {
      supabase: supabaseConfigured,
      authSecret: Boolean(process.env.AUTH_SECRET),
      envPassword: Boolean(process.env.MINIGAME_ACCESS_PASSWORD),
    },
  });
}

const url = z.union([z.literal(''), z.string().trim().url().max(500)]).optional();
const schema = z.object({
  slug: z.string(),
  settings: z.object({
    access: z.enum(['private', 'public']),
    password: z.string().trim().max(100),
    releaseDate: z.union([z.literal(''), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]),
    gift: z.boolean(),
    // Data URL compressée par l'admin (~700 px) ou chemin/URL.
    cover: z.string().max(1_500_000),
    links: z.object({ spotify: url, appleMusic: url }),
  }),
});

export async function POST(req: Request) {
  if (!(await verifyToken(cookies().get(SESSION_COOKIE)?.value))) return unauthorized();
  if (!supabaseConfigured) return NextResponse.json({ ok: false, error: 'Supabase non configuré' }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON invalide' }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { ok: false, error: `Réglage invalide : ${first?.path.join('.') || '?'}` },
      { status: 400 },
    );
  }
  const { slug, settings } = parsed.data;
  if (!games[slug]) return NextResponse.json({ ok: false, error: 'Jeu inconnu' }, { status: 404 });
  if (settings.access === 'private' && settings.password.length < 4)
    return NextResponse.json({ ok: false, error: 'Mot de passe : 4 caractères minimum' }, { status: 400 });

  const links = Object.fromEntries(Object.entries(settings.links).filter(([, v]) => v)) as GameSettings['links'];
  const result = await saveGameSettings(slug, { ...settings, links });
  if (!result.ok) return NextResponse.json({ ok: false, error: result.error ?? 'Échec' }, { status: 500 });
  revalidatePath(`/play/${slug}`);
  return NextResponse.json({ ok: true });
}
