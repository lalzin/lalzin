/**
 * Recense les visuels d'états de chaque plugin (public/images/plugins/<slug>/ui-*.webp,
 * hors ui-hero) dans lib/pluginStates.json, lu par la galerie des pages produit.
 *
 * Lancé automatiquement avant `npm run build` et `npm run dev` : ajouter une
 * image suffit, il n'y a aucune liste à tenir à jour dans le code.
 */
import { readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// fileURLToPath : le chemin du projet contient un espace, une URL le percent-encode.
const racine = fileURLToPath(new URL('../public/images/plugins/', import.meta.url));
const sortie = fileURLToPath(new URL('../lib/pluginStates.json', import.meta.url));

const etats = {};
for (const slug of readdirSync(racine, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort()) {
  const dossier = join(racine, slug);
  if (!existsSync(dossier)) continue;
  // Tri naturel : « ui-25 » avant « ui-100 », pas l'inverse.
  const fichiers = readdirSync(dossier)
    .filter((f) => /^ui-.+\.webp$/.test(f) && !/^ui-hero/.test(f))
    .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));
  if (fichiers.length) etats[slug] = fichiers;
}

writeFileSync(sortie, `${JSON.stringify(etats, null, 2)}\n`);
console.log(`[états] ${Object.keys(etats).length} plugins :`);
for (const [slug, f] of Object.entries(etats)) console.log(`  ${slug} → ${f.join(', ')}`);
