import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Client Supabase — SERVEUR UNIQUEMENT.
 * Utilise la clé service_role (jamais exposée au client : pas de préfixe
 * NEXT_PUBLIC). Toute lecture/écriture du contenu passe côté serveur.
 */
const url = process.env.SUPABASE_URL;
// Accepte l'ancien nom (service_role) ET le nouveau (secret key sb_secret_…).
const serviceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

export const supabaseConfigured = Boolean(url && serviceKey);

let cached: SupabaseClient | null = null;

export function supabaseServer(): SupabaseClient | null {
  if (!supabaseConfigured) return null;
  if (!cached) {
    cached = createClient(url as string, serviceKey as string, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        // Empêche Next.js de mettre en cache les requêtes Supabase
        // (sinon le site ressert une lecture périmée après une écriture).
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
    });
  }
  return cached;
}
