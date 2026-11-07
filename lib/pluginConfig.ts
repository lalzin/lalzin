/**
 * ════════════════════════════════════════════════════════════════════
 *  CONFIGURATION DES PLUGINS — éditable depuis /admin
 * ════════════════════════════════════════════════════════════════════
 *  lib/plugins.json fournit les valeurs par défaut (il est régénéré par
 *  le projet groove-knobs avec les visuels). L'admin peut surcharger ce
 *  qui bouge d'une release à l'autre : la version, le nom du fichier
 *  d'installation, sa taille, la configuration requise, les formats, et
 *  la liste des plugins publiés.
 *
 *  Les surcharges vivent dans la table site_content, ligne « plugins »,
 *  à côté du contenu du site. Serveur uniquement (clé service_role).
 * ════════════════════════════════════════════════════════════════════
 */
import { unstable_noStore as noStore } from 'next/cache';
import { supabaseServer } from './supabase';
import {
  ALL_PLUGINS,
  DEFAULT_PUBLISHED,
  SUITE,
  type OS,
  type Plugin,
  type PluginDownload,
} from './plugins';

const TABLE = 'site_content';
const ROW_ID = 'plugins';

export type DownloadOverride = Partial<Pick<PluginDownload, 'file' | 'bytes' | 'requirements' | 'formats'>>;

export type PluginOverride = {
  version?: string;
  /** Dossier R2 ; vide = le slug. */
  folder?: string;
  downloads?: Partial<Record<OS, DownloadOverride>>;
};

export type PluginConfig = {
  /** Slugs réellement en ligne, dans l'ordre d'affichage. */
  published: string[];
  /** Surcharges par plugin (tout champ absent reprend lib/plugins.json). */
  bySlug: Record<string, PluginOverride>;
};

export const defaultConfig: PluginConfig = {
  published: [...DEFAULT_PUBLISHED],
  bySlug: {},
};

/* ------------------------------------------------------------- LECTURE */
/** Config brute (surcharges seules), telle qu'elle est stockée. */
export async function getPluginConfig(): Promise<PluginConfig> {
  noStore(); // une version modifiée doit être visible immédiatement
  const sb = supabaseServer();
  if (!sb) return defaultConfig;
  try {
    const { data, error } = await sb.from(TABLE).select('data').eq('id', ROW_ID).maybeSingle();
    if (error || !data?.data) return defaultConfig;
    const saved = data.data as Partial<PluginConfig>;
    return {
      published: Array.isArray(saved.published) ? saved.published : defaultConfig.published,
      bySlug: saved.bySlug ?? {},
    };
  } catch {
    return defaultConfig;
  }
}

/** Applique les surcharges d'un plugin sur ses valeurs par défaut. */
export function merge(base: Plugin, override?: PluginOverride): Plugin {
  if (!override) return base;
  const downloads = { ...base.downloads };
  for (const os of ['macos', 'windows'] as OS[]) {
    const patch = override.downloads?.[os];
    if (patch) downloads[os] = { ...downloads[os], ...patch };
  }
  return {
    ...base,
    version: override.version || base.version,
    r2Folder: override.folder || base.r2Folder,
    downloads,
  };
}

/** Plugins publiés, surcharges appliquées, dans l'ordre de `published`. */
export async function getPlugins(): Promise<Plugin[]> {
  const config = await getPluginConfig();
  return config.published
    .map((slug) => {
      const base = ALL_PLUGINS.find((p) => p.slug === slug);
      return base ? merge(base, config.bySlug[slug]) : null;
    })
    .filter((p): p is Plugin => p !== null);
}

export async function getPlugin(slug: string): Promise<Plugin | undefined> {
  return (await getPlugins()).find((p) => p.slug === slug);
}

export async function getPublishedSlugs(): Promise<string[]> {
  return (await getPlugins()).map((p) => p.slug);
}

/** Filtre des slugs reçus du client : ne garde que les publiés, sans doublon. */
export async function keepPublished(slugs: string[]): Promise<string[]> {
  const published = await getPublishedSlugs();
  return published.filter((slug) => slugs.includes(slug));
}

/* ----------------------------------------------------- SUITE COMPLÈTE */
/** L'installateur de la suite, s'il existe et s'il est publié dans /admin. */
export async function getSuite(): Promise<Plugin | null> {
  if (!SUITE) return null;
  const config = await getPluginConfig();
  if (!config.published.includes(SUITE.slug)) return null;
  return merge(SUITE, config.bySlug[SUITE.slug]);
}

/** Tout ce qui se télécharge : les plugins publiés, plus la suite si elle l'est. */
export async function getDownloadables(): Promise<Plugin[]> {
  const [plugins, suiteEnLigne] = await Promise.all([getPlugins(), getSuite()]);
  return suiteEnLigne ? [...plugins, suiteEnLigne] : plugins;
}

export async function getDownloadable(slug: string): Promise<Plugin | undefined> {
  return (await getDownloadables()).find((p) => p.slug === slug);
}

/** Filtre des slugs reçus du client : plugins publiés et suite, sans doublon. */
export async function keepDownloadable(slugs: string[]): Promise<string[]> {
  return (await getDownloadables()).map((p) => p.slug).filter((slug) => slugs.includes(slug));
}

/* ------------------------------------------------------------ ÉCRITURE */
export async function savePluginConfig(config: PluginConfig): Promise<{ ok: boolean; error?: string }> {
  const sb = supabaseServer();
  if (!sb) return { ok: false, error: 'Supabase non configuré' };
  const { error } = await sb
    .from(TABLE)
    .upsert({ id: ROW_ID, data: config, updated_at: new Date().toISOString() });
  return error ? { ok: false, error: error.message } : { ok: true };
}
