/**
 * ════════════════════════════════════════════════════════════════════
 *  POST /api/plugins/request — demande de téléchargement
 * ════════════════════════════════════════════════════════════════════
 *  Validation zod → honeypot → Turnstile → quotas → enregistrement
 *  → email avec les liens signés. Réponse immédiate au client, qui
 *  redirige vers /plugins/merci.
 * ════════════════════════════════════════════════════════════════════
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { defaultContent } from '@/lib/content';
import { addToAudience, emailConfigured, sendDownloadEmail } from '@/lib/email';
import { hashIP, signDownloadToken } from '@/lib/downloadToken';
import { checkQuotas, createRequest } from '@/lib/pluginRequests';
import { getPlugins, keepPublished } from '@/lib/pluginConfig';
import { verifyTurnstile } from '@/lib/turnstile';
import { buildEmailProps, clientIP, siteOrigin } from '../shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  os: z.enum(['macos', 'windows']),
  plugins: z.array(z.string()).min(1).max(10),
  newsletter: z.boolean().default(false),
  lang: z.enum(['fr', 'en']).default('fr'),
  turnstileToken: z.string().optional(),
  /** Honeypot : rempli uniquement par un robot (accepté puis ignoré). */
  website: z.string().max(200).optional(),
});

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }
  const input = parsed.data;

  // Honeypot : on répond « ok » sans rien faire (le robot ne doit rien apprendre).
  if (input.website) return NextResponse.json({ ok: true, redirect: '/plugins/merci' });

  const ip = clientIP(req);
  if (!(await verifyTurnstile(input.turnstileToken, ip ?? undefined))) {
    return NextResponse.json({ ok: false, error: 'captcha' }, { status: 400 });
  }

  // Ne garde que des plugins réellement publiés, et un OS réellement dispo.
  const slugs = await keepPublished(input.plugins);
  if (slugs.length === 0) {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const ipHash = ip ? await hashIP(ip) : null;
  const quota = await checkQuotas(input.email, ipHash);
  if (!quota.ok) {
    return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 });
  }

  const requestId =
    (await createRequest({
      email: input.email,
      plugins: slugs,
      os: input.os,
      lang: input.lang,
      newsletter: input.newsletter,
      ipHash,
      userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
    })) ?? crypto.randomUUID(); // sans Supabase, le flux reste fonctionnel

  const token = await signDownloadToken(requestId, slugs);
  if (!token) {
    // DOWNLOAD_TOKEN_SECRET manquant
    return NextResponse.json({ ok: false, error: 'no-token-secret' }, { status: 503 });
  }

  if (!emailConfigured) {
    // RESEND_API_KEY manquante
    return NextResponse.json({ ok: false, error: 'no-mailer' }, { status: 503 });
  }

  const origin = siteOrigin(req);
  const sent = await sendDownloadEmail(
    input.email,
    defaultContent.artist.bookingEmail,
    buildEmailProps({ plugins: await getPlugins(), slugs, os: input.os, lang: input.lang, token, origin }),
  );
  if (!sent.ok) {
    return NextResponse.json({ ok: false, error: 'mail-rejected' }, { status: 502 });
  }

  if (input.newsletter) await addToAudience(input.email);

  // Jeton court (24 h) permettant de redemander l'email sans exposer l'adresse.
  const resendToken = await signDownloadToken(requestId, slugs, 24 * 3600 * 1000);

  return NextResponse.json({
    ok: true,
    redirect: `/plugins/merci?p=${slugs.join(',')}${resendToken ? `&r=${encodeURIComponent(resendToken)}` : ''}`,
  });
}
