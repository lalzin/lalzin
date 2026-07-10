/**
 * ════════════════════════════════════════════════════════════════════
 *  AUTHENTIFICATION ADMIN — sécurisée
 * ════════════════════════════════════════════════════════════════════
 *  - Aucun secret n'est écrit en dur ici : tout vient des variables
 *    d'environnement (AUTH_SECRET, ADMIN_USERNAME, ADMIN_PASSWORD_HASH).
 *  - Le mot de passe n'est jamais stocké en clair : on garde uniquement
 *    un hash PBKDF2-SHA256 (salé). Impossible de le retrouver depuis le
 *    hash. Générer le hash avec :  npm run set-admin
 *  - Le jeton de session est signé HMAC-SHA256 (cookie httpOnly).
 *  - Fail-closed : si rien n'est configuré, l'accès est refusé.
 *
 *  Compatible Edge (middleware) ET Node (route handler) via Web Crypto.
 * ════════════════════════════════════════════════════════════════════
 */

export const SESSION_COOKIE = 'lalzin_admin';
const MAX_AGE_SEC = 7 * 24 * 3600; // 7 jours
const PBKDF2_ITERATIONS = 100_000;

const encoder = new TextEncoder();
const SECRET = process.env.AUTH_SECRET;

// Web Crypto attend un BufferSource ; contourne l'incompatibilité de types
// Uint8Array<ArrayBufferLike> introduite par les libs TS récentes.
const bs = (u: Uint8Array): BufferSource => u as unknown as BufferSource;

/* ------------------------------------------------------------ base64url */
function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function b64urlToBytes(s: string): Uint8Array {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}
function b64urlToString(s: string): string {
  return new TextDecoder().decode(b64urlToBytes(s));
}

/** Comparaison à temps constant (anti timing-attack). */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

/* --------------------------------------------------- Hash de mot de passe */
/** Génère un hash PBKDF2 salé, encodé « iterations.salt.hash » (base64url). */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', bs(encoder.encode(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: bs(salt), iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256,
  );
  return `${PBKDF2_ITERATIONS}.${bytesToB64url(salt)}.${bytesToB64url(new Uint8Array(bits))}`;
}

/** Vérifie un mot de passe contre un hash « iterations.salt.hash ». */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('.');
  if (parts.length !== 3) return false;
  const [iterStr, saltB64, hashB64] = parts;
  const iterations = parseInt(iterStr, 10);
  if (!iterations) return false;
  const salt = b64urlToBytes(saltB64);
  const key = await crypto.subtle.importKey('raw', bs(encoder.encode(password)), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: bs(salt), iterations, hash: 'SHA-256' },
    key,
    256,
  );
  return safeEqual(bytesToB64url(new Uint8Array(bits)), hashB64);
}

/* ------------------------------------------------------ Jeton de session */
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

export type Session = { u: string; exp: number };

export async function signToken(username: string): Promise<string | null> {
  if (!SECRET) return null;
  const payload: Session = { u: username, exp: Date.now() + MAX_AGE_SEC * 1000 };
  const body = bytesToB64url(encoder.encode(JSON.stringify(payload)));
  return `${body}.${await hmac(body)}`;
}

export async function verifyToken(token: string | undefined): Promise<Session | null> {
  if (!SECRET || !token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  if (!safeEqual(sig, await hmac(body))) return null;
  try {
    const session = JSON.parse(b64urlToString(body)) as Session;
    if (!session.exp || session.exp < Date.now()) return null;
    return session;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: MAX_AGE_SEC,
};
