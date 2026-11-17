/**
 * Application des surcharges de l'admin sur les valeurs par défaut d'un
 * plugin. Fonctions pures, utilisables côté serveur comme dans l'admin
 * (qui affiche ainsi le chemin R2 exact que le site va demander).
 */
import type { OS, Plugin, PluginDownload } from './plugins';

export type DownloadOverride = Partial<Pick<PluginDownload, 'file' | 'bytes' | 'requirements' | 'formats'>>;

export type PluginOverride = {
  version?: string;
  /** Dossier R2 ; vide = le dossier par défaut (le slug, groove-knobs pour la suite). */
  folder?: string;
  downloads?: Partial<Record<OS, DownloadOverride>>;
};

const OSES: OS[] = ['macos', 'windows'];

/**
 * Applique les surcharges d'un plugin sur ses valeurs par défaut.
 *
 * Quand seule la version change, le nom de fichier suit : les installateurs
 * s'appellent `<Nom>-<version>-<OS>…`, donc `FrenchFilter-0.1.9-macOS.pkg`
 * devient `FrenchFilter-0.2.0-macOS.pkg`. La taille par défaut, qui était
 * celle de l'ancienne version, est alors masquée. Un nom de fichier ou une
 * taille saisis dans l'admin restent prioritaires.
 */
export function merge(base: Plugin, override?: PluginOverride): Plugin {
  if (!override) return base;
  const version = override.version?.trim() || base.version;
  const autreVersion = version !== base.version;

  const downloads = { ...base.downloads };
  for (const os of OSES) {
    const d = downloads[os];
    if (!d) continue;
    const suivi = autreVersion
      ? { ...d, file: d.file ? d.file.split(base.version).join(version) : d.file, bytes: null }
      : d;
    downloads[os] = { ...suivi, ...stripEmpty(override.downloads?.[os]) };
  }

  return {
    ...base,
    version,
    r2Folder: override.folder?.trim() || base.r2Folder,
    downloads,
  };
}

/** Ignore les champs laissés vides dans l'admin. */
function stripEmpty(patch?: DownloadOverride): DownloadOverride {
  if (!patch) return {};
  const out: DownloadOverride = {};
  if (patch.file) out.file = patch.file;
  if (patch.bytes != null) out.bytes = patch.bytes;
  if (patch.requirements) out.requirements = patch.requirements;
  if (patch.formats?.length) out.formats = patch.formats;
  return out;
}
