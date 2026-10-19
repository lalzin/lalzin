/**
 * ════════════════════════════════════════════════════════════════════
 *  JETONS DE TÉLÉCHARGEMENT — signés HMAC-SHA256
 * ════════════════════════════════════════════════════════════════════
 *  Même principe que lib/auth.ts : charge utile en base64url + signature.
 *  Le jeton porte l'id de la demande et les plugins autorisés, et expire
 *  au bout de 7 jours. Il ne contient aucune donnée personnelle (pas
 *  d'email) : il peut donc circuler dans une URL sans risque.
 *
 *  Secret : DOWNLOAD_TOKEN_SECRET (jamais préfixé NEXT_PUBLIC).
 * ════════════════════════════════════════════════════════════════════
 */

const DAY = 24 * 3600 * 1000;
export const TOKEN_MAX_AGE_MS = 7 * DAY;

const encoder = new TextEncoder();
const SECRET = process.env.DOWNLOAD_TOKEN_SECRET;

export const downloadTokenConfigured = Boolean(SECRET);

const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

/** Comparaison à temps constant (anti timing-attack). */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

async function hmac(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    bs(encoder.encode(SECRET)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, bs(encoder.encode(data)));
  return bytesToB64url(new Uint8Array(sig));
}

export type DownloadClaims = {
  /** id de la ligne plugin_requests */
  r: string;
  /** slugs autorisés par ce jeton */
  p: string[];
  /** expiration (ms epoch) */
  exp: number;
};

export async function signDownloadToken(
  requestId: string,
  slugs: string[],
  maxAgeMs = TOKEN_MAX_AGE_MS,
): Promise<string | null> {
  if (!SECRET) return null;
  const claims: DownloadClaims = { r: requestId, p: slugs, exp: Date.now() + maxAgeMs };
  const body = bytesToB64url(encoder.encode(JSON.stringify(claims)));
  return `${body}.${await hmac(body)}`;
}

/** Renvoie les claims si la signature est bonne ET le jeton non expiré. */
export async function verifyDownloadToken(token: string | undefined | null): Promise<DownloadClaims | null> {
  if (!SECRET || !token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  if (!safeEqual(sig, await hmac(body))) return null;
  try {
    const claims = JSON.parse(new TextDecoder().decode(b64urlToBytes(body))) as DownloadClaims;
    if (!claims?.exp || claims.exp < Date.now()) return null;
    if (!Array.isArray(claims.p) || !claims.r) return null;
    return claims;
  } catch {
    return null;
  }
}

/** Empreinte non réversible d'une IP (RGPD : on ne stocke jamais l'IP en clair). */
export async function hashIP(ip: string): Promise<string> {
  const salt = SECRET ?? 'lalzin';
  const digest = await crypto.subtle.digest('SHA-256', bs(encoder.encode(`${salt}:${ip}`)));
  return bytesToB64url(new Uint8Array(digest)).slice(0, 32);
}
