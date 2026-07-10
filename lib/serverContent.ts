import { unstable_noStore as noStore } from 'next/cache';
import { defaultContent, type Content } from './content';
import { supabaseServer } from './supabase';

const TABLE = 'site_content';
const ROW_ID = 'main';

/** Fusionne le contenu Supabase avec les valeurs par défaut (tolère les champs manquants). */
function merge(saved: Partial<Content>): Content {
  return {
    ...defaultContent,
    ...saved,
    artist: { ...defaultContent.artist, ...saved.artist },
    video: { ...defaultContent.video, ...saved.video },
    site: { ...defaultContent.site, ...saved.site },
  };
}

/**
 * Lit le contenu du site depuis Supabase (côté serveur).
 * Repli sur `defaultContent` si Supabase n'est pas configuré ou vide.
 * `cache()` déduplique l'appel au sein d'une même requête.
 */
export async function getContent(): Promise<Content> {
  noStore(); // jamais de cache : toujours la dernière version publiée
  const sb = supabaseServer();
  if (!sb) return defaultContent;
  try {
    const { data, error } = await sb.from(TABLE).select('data').eq('id', ROW_ID).maybeSingle();
    if (error || !data?.data) return defaultContent;
    return merge(data.data as Partial<Content>);
  } catch {
    return defaultContent;
  }
}

/** Écrit le contenu dans Supabase. Renvoie l'erreur éventuelle. */
export async function saveContent(content: Content): Promise<{ ok: boolean; error?: string }> {
  const sb = supabaseServer();
  if (!sb) return { ok: false, error: 'Supabase non configuré' };
  const { error } = await sb
    .from(TABLE)
    .upsert({ id: ROW_ID, data: content, updated_at: new Date().toISOString() });
  return error ? { ok: false, error: error.message } : { ok: true };
}
