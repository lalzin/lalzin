import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase';
import { sameString, scoreClaim } from '@/lib/minigame/settings';

/**
 * POST { id, claim, email } → rattache un e-mail à un score du Top 10
 * (pour contacter le n°1 du jour de sortie). `claim` n'est délivré par
 * /api/minigame/scores qu'aux scores classés dans le Top 10.
 */
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const schema = z.object({
  id: z.string().uuid(),
  claim: z.string().min(10).max(100),
  email: z.string().trim().toLowerCase().max(200).pipe(z.email()),
});

export async function POST(req: NextRequest) {
  const db = supabaseServer();
  if (!db) return NextResponse.json({ error: 'indisponible' }, { status: 503 });
  let parsed;
  try {
    parsed = schema.safeParse(await req.json());
  } catch {
    return NextResponse.json({ error: 'requête invalide' }, { status: 400 });
  }
  if (!parsed.success) return NextResponse.json({ error: 'email' }, { status: 400 });
  const { id, claim, email } = parsed.data;
  const expected = scoreClaim(id);
  if (!expected || !sameString(claim, expected)) return NextResponse.json({ error: 'refusé' }, { status: 403 });

  const { error } = await db
    .from('minigame_scores')
    .update({ email, email_at: new Date().toISOString() })
    .eq('id', id);
  if (error) return NextResponse.json({ error: 'indisponible' }, { status: 503 });
  return NextResponse.json({ ok: true });
}
