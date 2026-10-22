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
import states from './pluginStates.json';
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
  /** Mention de signature, ex. « Developer ID + notarised by Apple ». */
  signed?: string;
  /** Lien public de la release (information ; le téléchargement passe par R2). */
  url?: string;
  /** Plugins contenus dans l'installateur, quand il y en a plusieurs. */
  includes?: string[];
};

/** Un plugin est un effet audio, sauf s'il est déclaré instrument. */
export type PluginType = 'instrument' | 'effect';

export type Plugin = {
  slug: string;
  name: string;
  version: string;
  mascot: string;
  /** Absent = effet (compatibilité avec les premiers plugins). */
  type?: PluginType;
  /** Latence annoncée en millisecondes, quand elle est significative. */
  latency_ms?: number;
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

/**
 * Visuels recensés au build par scripts/build-plugin-states.mjs :
 * écrans de galerie et dimensions réelles de chaque image.
 */
type Manifeste = Record<string, { states: string[]; images: Record<string, number[]> }>;
const VISUELS = states as Manifeste;

/**
 * Dimensions réelles d'un visuel. Les fenêtres n'ont pas toutes le même
 * format (Kick Lock est en paysage), une taille en dur les déformerait.
 */
export function imageSize(slug: string, file: string): [number, number] {
  const taille = VISUELS[slug]?.images?.[file];
  return taille?.length === 2 ? [taille[0], taille[1]] : [840, 1040];
}

/**
 * Fenêtre en paysage (Kick Lock, 760 x 480) ou en portrait (les autres,
 * 420 x 520) : la mise en page n'est pas la même pour l'une et l'autre.
 */
export function heroIsLandscape(slug: string): boolean {
  const [w, h] = imageSize(slug, 'ui-hero.webp');
  return w > h;
}

/** Libellés particuliers ; les autres sont dérivés du nom de fichier. */
const STATE_LABELS: Record<string, L> = {
  'ui-centre': { fr: 'Centre, son intact', en: 'Centre, untouched' },
  'ui-lp50': { fr: 'Passe-bas à 50 %', en: 'Low-pass at 50 %' },
  'ui-hp50': { fr: 'Passe-haut à 50 %', en: 'High-pass at 50 %' },
  'ui-curve': { fr: 'Courbe de ducking', en: 'Ducking curve' },
  'ui-explain': { fr: 'Chaque réglage expliqué', en: 'Every setting explained' },
  'ui-send': { fr: 'Kick Lock Send, sur le kick', en: 'Kick Lock Send, on the kick' },
  'ui-live': { fr: 'Mode LIVE', en: 'LIVE mode' },
  'ui-mono': { fr: 'MONO BELOW', en: 'MONO BELOW' },
  'ui-sidechain': { fr: 'PHASE éteint : sidechain simple', en: 'PHASE off: plain sidechain' },
};

/** « ui-25 » → « 25 % » ; « ui-gospel » → « Gospel ». */
function labelFromFile(file: string): L {
  const key = file.replace(/\.webp$/, '');
  if (STATE_LABELS[key]) return STATE_LABELS[key];
  const brut = key.replace(/^ui-/, '');
  const texte = /^\d+$/.test(brut)
    ? `${brut} %`
    : brut.charAt(0).toUpperCase() + brut.slice(1).replace(/-/g, ' ');
  return { fr: texte, en: texte };
}

export type UIState = { file: string; label: L; width: number; height: number };

export const uiStates = (slug: string): UIState[] =>
  (VISUELS[slug]?.states ?? []).map((file) => {
    const [width, height] = imageSize(slug, file);
    return { file, label: labelFromFile(file), width, height };
  });

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
