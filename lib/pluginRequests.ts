/**
 * ════════════════════════════════════════════════════════════════════
 *  DEMANDES DE PLUGINS — accès Supabase (serveur uniquement)
 * ════════════════════════════════════════════════════════════════════
 *  Tables : plugin_requests (une demande = un email) et plugin_downloads
 *  (un clic sur un lien de téléchargement). RLS activée, aucune policy
 *  publique : seule la clé service_role utilisée ici y accède.
 *
 *  Les quotas anti-spam sont comptés en base (et non en mémoire) pour
 *  rester fiables sur Vercel, où chaque requête peut tomber sur une
 *  instance différente.
 * ════════════════════════════════════════════════════════════════════
 */
import type { Lang } from './content';
import type { OS } from './plugins';
import { supabaseServer } from './supabase';

export const REQUESTS_TABLE = 'plugin_requests';
export const DOWNLOADS_TABLE = 'plugin_downloads';

/** Quotas anti-spam. */
export const LIMIT_PER_IP_PER_HOUR = 5;
export const LIMIT_PER_EMAIL_PER_DAY = 3;

export type PluginRequestRow = {
  id: string;
  email: string;
  plugins: string[];
  os: OS;
  lang: Lang;
  newsletter: boolean;
  consent_at: string | null;
  ip_hash: string | null;
  user_agent: string | null;
  created_at: string;
};

export type NewPluginRequest = {
  email: string;
  plugins: string[];
  os: OS;
  lang: Lang;
  newsletter: boolean;
  ipHash: string | null;
  userAgent: string | null;
};

/* --------------------------------------------------------------- QUOTAS */
export type QuotaResult = { ok: true } | { ok: false; reason: 'ip' | 'email' };

/**
 * Vérifie les deux quotas : 5 demandes / heure / IP et 3 / jour / email.
 * Sans Supabase, on laisse passer (le site reste utilisable en local).
 */
export async function checkQuotas(email: string, ipHash: string | null): Promise<QuotaResult> {
  const sb = supabaseServer();
  if (!sb) return { ok: true };

  const now = Date.now();
  const hourAgo = new Date(now - 3600_000).toISOString();
  const dayAgo = new Date(now - 24 * 3600_000).toISOString();

  if (ipHash) {
    const { count } = await sb
      .from(REQUESTS_TABLE)
      .select('id', { count: 'exact', head: true })
      .eq('ip_hash', ipHash)
      .gte('created_at', hourAgo);
    if ((count ?? 0) >= LIMIT_PER_IP_PER_HOUR) return { ok: false, reason: 'ip' };
  }

  const { count: emailCount } = await sb
    .from(REQUESTS_TABLE)
    .select('id', { count: 'exact', head: true })
    .eq('email', email)
    .gte('created_at', dayAgo);
  if ((emailCount ?? 0) >= LIMIT_PER_EMAIL_PER_DAY) return { ok: false, reason: 'email' };

  return { ok: true };
}

/* ------------------------------------------------------------ ÉCRITURES */
/** Enregistre la demande. Renvoie l'id (ou null si Supabase absent / erreur). */
export async function createRequest(req: NewPluginRequest): Promise<string | null> {
  const sb = supabaseServer();
  if (!sb) return null;

  const { data, error } = await sb
    .from(REQUESTS_TABLE)
    .insert({
      email: req.email,
      plugins: req.plugins,
      os: req.os,
      lang: req.lang,
      newsletter: req.newsletter,
      consent_at: req.newsletter ? new Date().toISOString() : null,
      ip_hash: req.ipHash,
      user_agent: req.userAgent,
    })
    .select('id')
    .single();

  if (error || !data) return null;
  return (data as { id: string }).id;
}

export async function getRequest(id: string): Promise<PluginRequestRow | null> {
  const sb = supabaseServer();
  if (!sb) return null;
  const { data, error } = await sb.from(REQUESTS_TABLE).select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return data as PluginRequestRow;
}

/** Incrémente le compteur de téléchargements (une ligne par clic). */
export async function logDownload(params: {
  requestId: string | null;
  plugin: string;
  os: OS;
  version: string;
}): Promise<void> {
  const sb = supabaseServer();
  if (!sb) return;
  await sb.from(DOWNLOADS_TABLE).insert({
    request_id: params.requestId,
    plugin: params.plugin,
    os: params.os,
    version: params.version,
  });
}

/* ----------------------------------------------------------- STATS ADMIN */
export type PluginStats = {
  requests: number;
  newsletterOptIn: number;
  downloads: number;
  byPlugin: Record<string, number>;
  byOS: Record<string, number>;
  byWeek: { week: string; downloads: number }[];
  lastRequests: { email: string; plugins: string[]; os: string; created_at: string }[];
};

/** Lundi (ISO) de la semaine d'une date, au format AAAA-MM-JJ. */
function weekStart(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7; // 0 = lundi
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export async function getStats(): Promise<PluginStats | null> {
  const sb = supabaseServer();
  if (!sb) return null;

  const [{ data: requests }, { data: downloads }] = await Promise.all([
    sb.from(REQUESTS_TABLE).select('email, plugins, os, newsletter, created_at').order('created_at', { ascending: false }),
    sb.from(DOWNLOADS_TABLE).select('plugin, os, created_at'),
  ]);

  const reqRows = (requests ?? []) as Pick<PluginRequestRow, 'email' | 'plugins' | 'os' | 'newsletter' | 'created_at'>[];
  const dlRows = (downloads ?? []) as { plugin: string; os: string; created_at: string }[];

  const byPlugin: Record<string, number> = {};
  const byOS: Record<string, number> = {};
  const weeks: Record<string, number> = {};

  for (const d of dlRows) {
    byPlugin[d.plugin] = (byPlugin[d.plugin] ?? 0) + 1;
    byOS[d.os] = (byOS[d.os] ?? 0) + 1;
    const w = weekStart(d.created_at);
    weeks[w] = (weeks[w] ?? 0) + 1;
  }

  return {
    requests: reqRows.length,
    newsletterOptIn: reqRows.filter((r) => r.newsletter).length,
    downloads: dlRows.length,
    byPlugin,
    byOS,
    byWeek: Object.entries(weeks)
      .map(([week, d]) => ({ week, downloads: d }))
      .sort((a, b) => a.week.localeCompare(b.week))
      .slice(-12),
    lastRequests: reqRows.slice(0, 20).map((r) => ({
      email: r.email,
      plugins: r.plugins,
      os: r.os,
      created_at: r.created_at,
    })),
  };
}

/** Emails ayant explicitement coché la newsletter (export CSV). */
export async function getOptInEmails(): Promise<{ email: string; consent_at: string | null; lang: string }[]> {
  const sb = supabaseServer();
  if (!sb) return [];
  const { data } = await sb
    .from(REQUESTS_TABLE)
    .select('email, consent_at, lang')
    .eq('newsletter', true)
    .order('consent_at', { ascending: false });

  const rows = (data ?? []) as { email: string; consent_at: string | null; lang: string }[];
  // Dédoublonne par email (on garde le consentement le plus récent).
  const seen = new Set<string>();
  const unique: typeof rows = [];
  for (const row of rows) {
    if (seen.has(row.email)) continue;
    seen.add(row.email);
    unique.push(row);
  }
  return unique;
}
