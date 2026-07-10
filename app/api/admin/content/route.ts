import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { SESSION_COOKIE, verifyToken } from '@/lib/auth';
import { saveContent } from '@/lib/serverContent';
import { supabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/** Enregistre le contenu du site (admin authentifié requis). */
export async function POST(req: Request) {
  const token = cookies().get(SESSION_COOKIE)?.value;
  const session = await verifyToken(token);
  if (!session) {
    return NextResponse.json({ ok: false, error: 'Non autorisé' }, { status: 401 });
  }
  if (!supabaseConfigured) {
    return NextResponse.json(
      { ok: false, error: 'Supabase non configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY manquants)' },
      { status: 503 },
    );
  }

  let data;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'JSON invalide' }, { status: 400 });
  }

  const ok = await saveContent(data);
  if (!ok) {
    return NextResponse.json({ ok: false, error: 'Échec de l’écriture Supabase' }, { status: 500 });
  }

  // Rafraîchit le site public immédiatement
  revalidatePath('/');
  revalidatePath('/links');
  return NextResponse.json({ ok: true });
}
