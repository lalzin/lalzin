/**
 * Vérifie que public/plugins/versions.json reste cohérent avec lib/plugins.json.
 * Les plugins installés interrogent ce fichier une fois par jour : une version
 * oubliée ou divergente leur annoncerait une mise à jour fantôme, ou aucune.
 *
 * Lancé avant chaque build (prebuild) : échoue avec un code non nul.
 *   npm run check-versions
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const lire = (rel) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8'));

const plugins = lire('../lib/plugins.json').plugins;
const versions = lire('../public/plugins/versions.json');

const erreurs = [];

if (!versions.updated || !/^\d{4}-\d{2}-\d{2}$/.test(versions.updated)) {
  erreurs.push(`champ « updated » absent ou mal formé : ${versions.updated}`);
}

for (const p of plugins) {
  const entree = versions.plugins?.[p.slug];
  if (!entree) {
    erreurs.push(`${p.slug} : absent de versions.json`);
    continue;
  }
  if (entree.version !== p.version) {
    erreurs.push(`${p.slug} : version ${entree.version} dans versions.json, ${p.version} dans plugins.json`);
  }
  const attendue = `https://www.lalzin.com/plugins/${p.slug}`;
  if (entree.url !== attendue) {
    erreurs.push(`${p.slug} : url ${entree.url}, attendue ${attendue}`);
  }
}

for (const slug of Object.keys(versions.plugins ?? {})) {
  if (!plugins.some((p) => p.slug === slug)) {
    erreurs.push(`${slug} : présent dans versions.json mais inconnu de plugins.json`);
  }
}

if (erreurs.length) {
  console.error('\x1b[31m✗ versions.json incohérent :\x1b[0m');
  for (const e of erreurs) console.error(`  • ${e}`);
  process.exit(1);
}

console.log(`\x1b[32m✓\x1b[0m versions.json cohérent (${plugins.length} plugins, mis à jour le ${versions.updated})`);
