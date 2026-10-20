/**
 * GET /api/admin/plugins        → statistiques (demandes / téléchargements)
 * GET /api/admin/plugins?csv=1  → export CSV des emails opt-in newsletter
 * Admin authentifié requis (même session que le reste de /admin).
 */
import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { SESSION_COOKIE, verifyToken } from '@/lib/auth';
import { getOptInEmails, getStats } from '@/lib/pluginRequests';
import { emailConfigured, lastSendError } from '@/lib/email';
import { r2Configured } from '@/lib/r2';
import { turnstileConfigured } from '@/lib/turnstile';
import { downloadTokenConfigured } from '@/lib/downloadToken';
import { getPluginConfig, savePluginConfig, type PluginConfig } from '@/lib/pluginConfig';
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
  return NextResponse.json({
    ok: true,
    stats,
    config: await getPluginConfig(),
    // État des services : booléens uniquement, aucune valeur de clé.
    services: {
      resend: emailConfigured,
      r2: r2Configured,
      turnstile: turnstileConfigured,
      jetons: downloadTokenConfigured,
      supabase: supabaseConfigured,
      dernierEchecEmail: lastSendError(),
    },
  });
}

/* ------------------------------------------- Enregistrement de la config */
const downloadSchema = z.object({
  file: z.string().trim().min(1).max(200).optional(),
  bytes: z.number().int().positive().nullable().optional(),
  requirements: z.string().trim().max(300).optional(),
  formats: z.array(z.string().trim().min(1).max(40)).max(10).optional(),
});

const configSchema = z.object({
  published: z.array(z.string().trim().min(1).max(60)).max(20),
  bySlug: z.record(
    z.string(),
    z.object({
      version: z.string().trim().max(30).optional(),
      downloads: z
        .object({ macos: downloadSchema.optional(), windows: downloadSchema.optional() })
        .optional(),
    }),
  ),
});

export async function POST(req: Request) {
  const session = await verifyToken(cookies().get(SESSION_COOKIE)?.value);
  if (!session) return NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 });

  if (!supabaseConfigured) {
    return NextResponse.json({ ok: false, error: 'Supabase non configuré' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON invalide' }, { status: 400 });
  }

  const parsed = configSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: 'Configuration invalide' }, { status: 400 });
  }

  const result = await savePluginConfig(parsed.data as PluginConfig);
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error ?? 'Échec' }, { status: 500 });
  }

  // Les pages publiques doivent refléter la nouvelle version tout de suite.
  revalidatePath('/plugins');
  revalidatePath('/plugins/[slug]', 'page');
  revalidatePath('/');
  return NextResponse.json({ ok: true });
}
