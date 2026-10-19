/**
 * GET /api/admin/plugins        → statistiques (demandes / téléchargements)
 * GET /api/admin/plugins?csv=1  → export CSV des emails opt-in newsletter
 * Admin authentifié requis (même session que le reste de /admin).
 */
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifyToken } from '@/lib/auth';
import { getOptInEmails, getStats } from '@/lib/pluginRequests';
import { supabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Échappement CSV (guillemets doublés, champ entre guillemets). */
const cell = (v: string) => `"${String(v ?? '').replace(/"/g, '""')}"`;

export async function GET(req: Request) {
  const session = await verifyToken(cookies().get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 });

  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase non configuré' }, { status: 503 });
  }

  if (new URL(req.url).searchParams.get('csv')) {
    const rows = await getOptInEmails();
    const csv = [
      ['email', 'consentement', 'langue'].map(cell).join(','),
      ...rows.map((r) => [r.email, r.consent_at ?? '', r.lang].map(cell).join(',')),
    ].join('\n');

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="lalzin-newsletter-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  const stats = await getStats();
  return NextResponse.json({ ok: true, stats });
}
