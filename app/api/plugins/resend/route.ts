/**
 * ════════════════════════════════════════════════════════════════════
 *  POST /api/plugins/resend — « je n'ai rien reçu »
 * ════════════════════════════════════════════════════════════════════
 *  Renvoie le même email à partir du jeton court remis à la page merci :
 *  l'adresse n'a jamais besoin de transiter par l'URL. Mêmes quotas que
 *  la demande initiale.
 * ════════════════════════════════════════════════════════════════════
 */
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { defaultContent } from '@/lib/content';
import { emailConfigured, sendDownloadEmail } from '@/lib/email';
import { hashIP, signDownloadToken, verifyDownloadToken } from '@/lib/downloadToken';
import { checkQuotas, createRequest, deleteRequest, getRequest } from '@/lib/pluginRequests';
import { type OS } from '@/lib/plugins';
import { getPlugins, keepPublished } from '@/lib/pluginConfig';
import { buildEmailProps, clientIP, siteOrigin } from '../shared';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({ token: z.string().min(10).max(2000) });

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });

  const claims = await verifyDownloadToken(parsed.data.token);
  if (!claims) return NextResponse.json({ ok: false, error: 'expired' }, { status: 400 });

  const original = await getRequest(claims.r);
  if (!original) {
    // Sans la demande d'origine (Supabase absent), impossible de retrouver l'email.
    return NextResponse.json({ ok: false, error: 'unknown' }, { status: 404 });
  }

  const ip = clientIP(req);
  const ipHash = ip ? await hashIP(ip) : null;
  const quota = await checkQuotas(original.email, ipHash);
  if (!quota.ok) return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 });

  if (!emailConfigured) return NextResponse.json({ ok: false, error: 'server' }, { status: 503 });

  const slugs = await keepPublished(claims.p);
  if (slugs.length === 0) return NextResponse.json({ ok: false, error: 'invalid' }, { status: 400 });

  // Un renvoi compte comme une demande (c'est ce qui fait tenir les quotas).
  const createdId = await createRequest({
      email: original.email,
      plugins: slugs,
      os: original.os as OS,
      lang: original.lang,
      newsletter: false, // jamais de ré-opt-in implicite
      ipHash,
    userAgent: req.headers.get('user-agent')?.slice(0, 300) ?? null,
  });
  const requestId = createdId ?? claims.r;

  const token = await signDownloadToken(requestId, slugs);
  if (!token) {
    if (createdId) await deleteRequest(createdId);
    return NextResponse.json({ ok: false, error: 'server' }, { status: 503 });
  }

  const sent = await sendDownloadEmail(
    original.email,
    defaultContent.artist.bookingEmail,
    buildEmailProps({
      plugins: await getPlugins(),
      slugs,
      os: original.os as OS,
      lang: original.lang,
      token,
      origin: siteOrigin(req),
    }),
  );

  if (!sent.ok) {
    if (createdId) await deleteRequest(createdId); // un échec ne coûte pas un quota
    return NextResponse.json({ ok: false, error: 'mail-rejected' }, { status: 502 });
  }
  return NextResponse.json({ ok: true });
}
