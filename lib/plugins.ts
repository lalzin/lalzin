/**
 * ════════════════════════════════════════════════════════════════════
 *  GROOVE KNOBS — données des plugins
 * ════════════════════════════════════════════════════════════════════
 *  Source unique : lib/plugins.json (généré avec les visuels par le
 *  projet groove-knobs). Aucun texte de plugin n'est écrit en dur dans
 *  les pages : tout passe par ce module.
 *
 *  Un plugin n'apparaît sur le site que si son slug est dans
 *  PUBLISHED_SLUGS — pour en publier un nouveau, il suffit de l'ajouter.
 * ════════════════════════════════════════════════════════════════════
 */
import data from './plugins.json';
import type { L } from './content';

/* --------------------------------------------------------------- TYPES */
export type OS = 'macos' | 'windows';

export type PluginColors = {
  background: string;
  accent: string;
  accent2: string;
  cream: string;
  accent3?: string;
};

export type PluginDownload = {
  file: string;
  /** `null` = build pas encore disponible pour cet OS. */
  bytes: number | null;
  requirements: string;
  formats: string[];
};

export type Plugin = {
  slug: string;
  name: string;
  version: string;
  mascot: string;
  colors: PluginColors;
  tagline: L;
  description: L;
  features: { fr: string[]; en: string[] };
  presets: string[];
  downloads: Record<OS, PluginDownload>;
};

export type Suite = {
  name: string;
  by: string;
  signature: string;
  tagline: L;
  images: { og: string; banner: string };
};

/* ---------------------------------------------------------- PUBLICATION */
/**
 * Plugins publiés par défaut. La liste réellement en ligne est éditable
 * depuis /admin : voir lib/pluginConfig.ts, qui fait autorité côté serveur.
 * En ajoutant un slug, génère aussi son visuel d'email :
 *   sips -s format jpeg -s formatOptions 82 \
 *     ../groove-knobs/web-assets/<slug>/og.png \
 *     --out public/images/plugins/<slug>/og-email.jpg
 */
export const DEFAULT_PUBLISHED = ['french-filter'] as const;

export const suite = data.suite as Suite;

/** Tous les plugins connus, y compris ceux qui ne sont pas publiés. */
export const ALL_PLUGINS = data.plugins as Plugin[];

/* ------------------------------------------------------------- VISUELS */
const BASE = '/images/plugins';

export const pluginImage = (slug: string, file: string) => `${BASE}/${slug}/${file}`;

/**
 * Visuel pour l'email : JPEG et non WebP, qu'Outlook Windows et les anciens
 * Apple Mail n'affichent pas. Même image que `og.webp`.
 */
export const pluginEmailImage = (slug: string) => `${BASE}/${slug}/og-email.jpg`;
export const suiteImage = (file: string) => `${BASE}/${file}`;

/** Visuels d'états du plugin (`ui-*.webp` hors hero), pour la galerie. */
export const UI_STATES: Record<string, { file: string; label: L }[]> = {
  'french-filter': [
    {
      file: 'ui-lp50.webp',
      label: { fr: 'Passe-bas à 50 %', en: 'Low-pass at 50 %' },
    },
    {
      file: 'ui-centre.webp',
      label: { fr: 'Centre, son intact', en: 'Centre, untouched' },
    },
    {
      file: 'ui-hp50.webp',
      label: { fr: 'Passe-haut à 50 %', en: 'High-pass at 50 %' },
    },
  ],
};

/* ------------------------------------------------------- DISPONIBILITÉ */
/**
 * Un OS est proposé dès qu'un fichier d'installation est déclaré.
 * `bytes` ne sert plus qu'à l'affichage : une taille inconnue n'empêche
 * pas le téléchargement, elle est simplement masquée.
 */
export const isOSAvailable = (plugin: Plugin, os: OS): boolean =>
  Boolean(plugin.downloads[os]?.file);

export const availableOS = (plugin: Plugin): OS[] =>
  (['macos', 'windows'] as OS[]).filter((os) => isOSAvailable(plugin, os));

/** Taille lisible : 36,2 Mo / 36.2 MB. */
export function formatBytes(bytes: number | null, lang: 'fr' | 'en'): string {
  if (!bytes) return '';
  const mb = bytes / 1_000_000;
  const n = mb.toFixed(1);
  return lang === 'fr' ? `${n.replace('.', ',')} Mo` : `${n} MB`;
}

export const OS_LABEL: Record<OS, string> = {
  macos: 'macOS',
  windows: 'Windows',
};

/**
 * Clé du fichier dans le bucket R2, telle qu'elle est rangée :
 * `french-filter/0.1.0/FrenchFilter-0.1.0-macOS.pkg`.
 */
export const r2Key = (plugin: Plugin, os: OS): string =>
  `${plugin.slug}/${plugin.version}/${plugin.downloads[os].file}`;
