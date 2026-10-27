import { createHash } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { games } from '@/games';
import { supabaseServer } from '@/lib/supabase';
import {
  accessCookie,
  canPlay,
  getGameSettings,
  parisDayRange,
  parisToday,
  scoreClaim,
} from '@/lib/minigame/settings';

/**
 * Tableau des scores des mini-jeux.
 * GET  ?slug=…&period=all|day  → top 10 (day = journée en cours, heure de Paris)
 * POST { slug, pseudo, score, levels, duration } → enregistre, renvoie le rang + top 10 ;
 *      dans le Top 10 (total ou du jour) : { id, claim } pour laisser son e-mail (route /email).
 * Anti-triche basique : bornes plausibles côté serveur + 5 envois / 10 min / IP.
 * Jeu en accès anticipé : réservé aux visiteurs qui ont le cookie d'accès.
 * Les e-mails ne sortent JAMAIS par cette route (admin uniquement).
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

async function allowed(req: NextRequest, slug: string) {
  return canPlay(await getGameSettings(slug), slug, req.cookies.get(accessCookie(slug))?.value);
}

const MAX_PER_LEVEL = 30000; // bien au-dessus d'un excellent niveau (~8-12 k)
const MIN_SECONDS_PER_LEVEL = 8;

const ipHash = (req: NextRequest) =>
  createHash('sha256')
    .update((req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() + (process.env.AUTH_SECRET ?? 'minigame'))
    .digest('hex')
    .slice(0, 32);

async function top10(slug: string, period: string) {
  const db = supabaseServer()!;
  let q = db.from('minigame_scores').select('pseudo, score, levels, created_at').eq('slug', slug);
  if (period === 'day') {
    const [from, to] = parisDayRange(parisToday());
    q = q.gte('created_at', from).lt('created_at', to);
  }
  const { data, error } = await q.order('score', { ascending: false }).order('created_at').limit(10);
  if (error) throw error;
  return data ?? [];
}

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? '';
  const period = req.nextUrl.searchParams.get('period') === 'day' ? 'day' : 'all';
  if (!games[slug]) return NextResponse.json({ error: 'jeu inconnu' }, { status: 404 });
  if (!(await allowed(req, slug))) return NextResponse.json({ error: 'accès réservé' }, { status: 403 });
  if (!supabaseServer()) return NextResponse.json({ error: 'scores indisponibles' }, { status: 503 });
  try {
    return NextResponse.json({ top: await top10(slug, period) });
  } catch {
    return NextResponse.json({ error: 'scores indisponibles' }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  const db = supabaseServer();
  if (!db) return NextResponse.json({ error: 'scores indisponibles' }, { status: 503 });
  let body: { slug?: string; pseudo?: string; score?: number; levels?: number; duration?: number };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'requête invalide' }, { status: 400 });
  }
  const slug = String(body.slug ?? '');
  const game = games[slug];
  if (!game) return NextResponse.json({ error: 'jeu inconnu' }, { status: 404 });
  if (!(await allowed(req, slug))) return NextResponse.json({ error: 'accès réservé' }, { status: 403 });

  // Pseudo : lettres, chiffres, espaces et - _ . ; 2 à 16 caractères.
  const pseudo = String(body.pseudo ?? '')
    .normalize('NFC')
    .replace(/[^\p{L}\p{N} _.\-]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 16);
  const score = Math.floor(Number(body.score));
  const levels = Math.floor(Number(body.levels));
  const duration = Math.floor(Number(body.duration));
  const maxLevels = game.config.levels.length;
  if (pseudo.length < 2) return NextResponse.json({ error: 'pseudo trop court' }, { status: 400 });
  if (!Number.isFinite(levels) || levels < 1 || levels > maxLevels)
    return NextResponse.json({ error: 'score refusé' }, { status: 400 });
  if (!Number.isFinite(score) || score < 0 || score > levels * MAX_PER_LEVEL)
    return NextResponse.json({ error: 'score refusé' }, { status: 400 });
  if (!Number.isFinite(duration) || duration < levels * MIN_SECONDS_PER_LEVEL)
    return NextResponse.json({ error: 'score refusé' }, { status: 400 });

  const ip = ipHash(req);
  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const { count } = await db
    .from('minigame_scores')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ip)
    .gte('created_at', since);
  if ((count ?? 0) >= 5) return NextResponse.json({ error: 'trop d’envois, réessaie plus tard' }, { status: 429 });

  const { data: row, error } = await db
    .from('minigame_scores')
    .insert({ slug, pseudo, score, levels, duration_s: duration, ip_hash: ip })
    .select('id')
    .single();
  if (error || !row) return NextResponse.json({ error: 'scores indisponibles' }, { status: 503 });

  const { count: better } = await db
    .from('minigame_scores')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)
    .gt('score', score);
  const [from, to] = parisDayRange(parisToday());
  const { count: betterToday } = await db
    .from('minigame_scores')
    .select('id', { count: 'exact', head: true })
    .eq('slug', slug)
    .gte('created_at', from)
    .lt('created_at', to)
    .gt('score', score);
  const rank = (better ?? 0) + 1;
  const dayRank = (betterToday ?? 0) + 1;
  // Top 10 (total ou du jour) : on peut laisser son e-mail pour le cadeau du n°1.
  const claim = rank <= 10 || dayRank <= 10 ? scoreClaim(row.id) : null;
  return NextResponse.json({
    rank,
    dayRank,
    top: await top10(slug, 'all'),
    ...(claim ? { id: row.id, claim } : {}),
  });
}
