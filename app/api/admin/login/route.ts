import { NextResponse } from 'next/server';
import {
  SESSION_COOKIE,
  cookieOptions,
  safeEqual,
  signToken,
  verifyPassword,
} from '@/lib/auth';

// Aucune valeur par défaut : tout vient des variables d'environnement.
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH; // recommandé (hash PBKDF2)
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD; // repli optionnel (clair)

export async function POST(req: Request) {
  // Fail-closed : si l'admin n'est pas configuré, on refuse tout.
  if (!ADMIN_USERNAME || (!ADMIN_PASSWORD_HASH && !ADMIN_PASSWORD)) {
    return NextResponse.json(
      { ok: false, error: 'Admin non configuré (variables d’environnement manquantes)' },
      { status: 503 },
    );
  }

  let username = '';
  let password = '';
  try {
    const body = await req.json();
    username = String(body.username ?? '');
    password = String(body.password ?? '');
  } catch {
    return NextResponse.json({ ok: false, error: 'Requête invalide' }, { status: 400 });
  }

  const userOk = safeEqual(username, ADMIN_USERNAME);
  const passOk = ADMIN_PASSWORD_HASH
    ? await verifyPassword(password, ADMIN_PASSWORD_HASH)
    : safeEqual(password, ADMIN_PASSWORD as string);

  // Temporisation anti brute-force
  await new Promise((r) => setTimeout(r, 400));

  if (!userOk || !passOk) {
    return NextResponse.json({ ok: false, error: 'Identifiants incorrects' }, { status: 401 });
  }

  const token = await signToken(username);
  if (!token) {
    return NextResponse.json(
      { ok: false, error: 'AUTH_SECRET manquant côté serveur' },
      { status: 503 },
    );
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, token, cookieOptions);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(SESSION_COOKIE, '', { ...cookieOptions, maxAge: 0 });
  return res;
}
