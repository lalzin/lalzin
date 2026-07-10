import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase — SERVEUR UNIQUEMENT.
 * Utilise la clé service_role (jamais exposée au client : pas de préfixe
 * NEXT_PUBLIC). Toute lecture/écriture du contenu passe côté serveur.
 */
const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const supabaseConfigured = Boolean(url && serviceKey);

let cached: SupabaseClient | null = null;

export function supabaseServer(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!cached) {
    cached = createClient(url as string, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
