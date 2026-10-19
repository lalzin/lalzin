/**
 * Vérification Cloudflare Turnstile (anti-robot).
 * Si aucune clé n'est configurée, la vérification est neutralisée :
 * le site reste utilisable en local, le honeypot et les quotas
 * restent actifs.
 */
import { turnstileSiteKey } from './publicConfig';

const SECRET = process.env.TURNSTILE_SECRET_KEY;

export const turnstileConfigured = Boolean(SECRET && turnstileSiteKey);

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  if (!turnstileConfigured) return true; // pas configuré → on ne bloque pas
  if (!token) return false;

  try {
    const body = new FormData();
    body.append('secret', SECRET as string);
    body.append('response', token);
    if (ip) body.append('remoteip', ip);

    const res = await fetch(VERIFY_URL, { method: 'POST', body });
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
