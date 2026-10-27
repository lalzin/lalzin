/**
 * Scores côté client : serveur (Supabase via /api/minigame/scores) si dispo,
 * sinon classement local au navigateur (le jeu reste jouable sans base).
 */
export type ScoreRow = { pseudo: string; score: number; levels: number; created_at: string; mine?: boolean };
export type ScoreResult = {
  top: ScoreRow[];
  rank?: number;
  local: boolean;
  /** Présents si le score est dans le Top 10 : permettent de laisser son e-mail. */
  claim?: { id: string; token: string };
};

const localKey = (slug: string) => `minigame:${slug}:scores`;

function readLocal(slug: string): ScoreRow[] {
  try {
    return JSON.parse(localStorage.getItem(localKey(slug)) ?? '[]') as ScoreRow[];
  } catch {
    return [];
  }
}

function writeLocal(slug: string, rows: ScoreRow[]) {
  try {
    localStorage.setItem(localKey(slug), JSON.stringify(rows.slice(0, 50)));
  } catch {
    /* stockage indisponible */
  }
}

const sortRows = (rows: ScoreRow[]) => [...rows].sort((a, b) => b.score - a.score || a.created_at.localeCompare(b.created_at));

export async function fetchTop(slug: string, period: 'all' | 'day'): Promise<ScoreResult> {
  try {
    const res = await fetch(`/api/minigame/scores?slug=${encodeURIComponent(slug)}&period=${period}`);
    if (res.ok) return { top: (await res.json()).top, local: false };
  } catch {
    /* hors ligne */
  }
  const day = Date.now() - 24 * 3600 * 1000;
  const rows = readLocal(slug).filter((r) => period === 'all' || Date.parse(r.created_at) >= day);
  return { top: sortRows(rows).slice(0, 10), local: true };
}

export async function submitScore(
  slug: string,
  entry: { pseudo: string; score: number; levels: number; duration: number },
): Promise<ScoreResult & { error?: string }> {
  try {
    const res = await fetch('/api/minigame/scores', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug, ...entry }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok)
      return {
        top: json.top,
        rank: json.rank,
        local: false,
        claim: json.id && json.claim ? { id: json.id, token: json.claim } : undefined,
      };
    if (res.status !== 503) return { top: [], local: false, error: json.error ?? 'erreur' };
  } catch {
    /* hors ligne → local */
  }
  const row: ScoreRow = { pseudo: entry.pseudo, score: entry.score, levels: entry.levels, created_at: new Date().toISOString() };
  const rows = sortRows([...readLocal(slug), row]);
  writeLocal(slug, rows);
  return { top: rows.slice(0, 10), rank: rows.indexOf(row) + 1, local: true };
}

/** Rattache un e-mail à un score du Top 10 (cadeau du n°1 le jour de sortie). */
export async function saveEmail(claim: { id: string; token: string }, email: string): Promise<boolean> {
  try {
    const res = await fetch('/api/minigame/scores/email', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: claim.id, claim: claim.token, email }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
