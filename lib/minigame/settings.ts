/**
 * ════════════════════════════════════════════════════════════════════
 *  RÉGLAGES DE SORTIE DES MINI-JEUX — éditables depuis /admin
 * ════════════════════════════════════════════════════════════════════
 *  Accès (privé avec mot de passe / public), date de sortie, cadeau du
 *  n°1, pochette et liens d'écoute. Stockés dans la table site_content,
 *  ligne « minigame:<slug> ». Serveur uniquement (clé service_role) :
 *  le mot de passe ne part jamais vers le navigateur.
 *
 *  Sans réglages enregistrés, un jeu est PRIVÉ et son mot de passe vaut
 *  la variable d'env MINIGAME_ACCESS_PASSWORD (sinon personne n'entre).
 * ════════════════════════════════════════════════════════════════════
 */
import { createHmac, timingSafeEqual } from 'node:crypto';
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from '@/lib/supabase';
import type { PublicGameSettings } from './publicSettings';

const TABLE = 'site_content';
const rowId = (slug: string) => `minigame:${slug}`;

export type GameSettings = PublicGameSettings & {
  /** private = accès anticipé avec mot de passe ; public = ouvert à tous. */
  access: 'private' | 'public';
  /** Mot de passe d'accès anticipé (en clair : l'admin doit pouvoir le relire et le partager). */
  password: string;
};

export function defaultSettings(): GameSettings {
  return {
    access: 'private',
    password: process.env.MINIGAME_ACCESS_PASSWORD ?? '',
    releaseDate: '',
    gift: true,
    cover: '',
    links: {},
  };
}

export async function getGameSettings(slug: string): Promise<GameSettings> {
  noStore(); // une sortie ou un nouveau mot de passe doivent s'appliquer tout de suite
  const base = defaultSettings();
  const sb = supabaseServer();
  if (!sb) return base;
  try {
    const { data, error } = await sb.from(TABLE).select('data').eq('id', rowId(slug)).maybeSingle();
    if (error || !data?.data) return base;
    const saved = data.data as Partial<GameSettings>;
    return {
      ...base,
      ...saved,
      // Mot de passe vide en base → on garde celui de l'env (jamais d'accès privé « ouvert »).
      password: saved.password || base.password,
      links: { ...saved.links },
    };
  } catch {
    return base;
  }
}

export async function saveGameSettings(slug: string, s: GameSettings): Promise<{ ok: boolean; error?: string }> {
  const sb = supabaseServer();
  if (!sb) return { ok: false, error: 'Supabase non configuré' };
  const { error } = await sb
    .from(TABLE)
    .upsert({ id: rowId(slug), data: s, updated_at: new Date().toISOString() });
  return error ? { ok: false, error: error.message } : { ok: true };
}

export const toPublic = (s: GameSettings): PublicGameSettings => ({
  releaseDate: s.releaseDate,
  gift: s.gift,
  cover: s.cover,
  links: s.links,
});

/* ─────────────────────────────────────────────── Accès anticipé (cookie) */

export const accessCookie = (slug: string) => `mg_access_${slug.replace(/[^a-z0-9-]/gi, '')}`;

const secret = () => process.env.AUTH_SECRET ?? '';

/** Jeton du cookie : lié au mot de passe courant → le changer révoque tous les accès. */
export function accessToken(slug: string, password: string): string | null {
  if (!secret() || !password) return null;
  return createHmac('sha256', secret()).update(`access:${slug}:${password}`).digest('base64url');
}

export function sameString(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Le visiteur peut-il jouer ? (jeu public, ou cookie valide pour le mot de passe actuel) */
export function canPlay(settings: GameSettings, slug: string, cookie: string | undefined) {
  if (settings.access === 'public') return true;
  const expected = accessToken(slug, settings.password);
  return !!expected && !!cookie && sameString(cookie, expected);
}

/** Preuve qu'un score a le droit de recevoir un e-mail (rendue seulement aux scores du Top 10). */
export function scoreClaim(id: string): string | null {
  if (!secret()) return null;
  return createHmac('sha256', secret()).update(`claim:${id}`).digest('base64url');
}

/* ───────────────────────────────────────────────────── Jour (heure de Paris) */

function parisOffsetMinutes(d: Date) {
  const tz =
    new Intl.DateTimeFormat('en-US', { timeZone: 'Europe/Paris', timeZoneName: 'longOffset' })
      .formatToParts(d)
      .find((p) => p.type === 'timeZoneName')?.value ?? '';
  const m = /GMT([+-])(\d{2}):(\d{2})/.exec(tz);
  return m ? (m[1] === '+' ? 1 : -1) * (Number(m[2]) * 60 + Number(m[3])) : 0;
}

/** AAAA-MM-JJ du jour courant à Paris. */
export const parisToday = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris' }).format(new Date());

/** Bornes UTC [début, fin[ d'une journée à Paris. */
export function parisDayRange(day: string): [string, string] {
  const off = parisOffsetMinutes(new Date(`${day}T12:00:00Z`));
  const start = Date.parse(`${day}T00:00:00Z`) - off * 60_000;
  return [new Date(start).toISOString(), new Date(start + 86_400_000).toISOString()];
}
