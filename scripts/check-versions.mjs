/**
 * Contrôle les données qui alimentent /plugins/versions.json.
 *
 * Ce fichier n'est plus un fichier statique : il est généré à la volée par
 * app/plugins/versions.json/route.ts à partir de lib/plugins.json et de la
 * configuration de /admin. Une divergence entre deux sources est donc
 * devenue impossible ; ce qui reste à vérifier, c'est que les données de
 * départ sont exploitables.
 *
 * Lancé avant chaque build (prebuild) ; échoue avec un code non nul.
 *   npm run check-versions
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const lire = (rel) =>
  JSON.parse(readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8'));

const plugins = lire('../lib/plugins.json').plugins;
const erreurs = [];

if (!Array.isArray(plugins) || plugins.length === 0) {
  erreurs.push('lib/plugins.json ne contient aucun plugin');
}

const vus = new Set();
for (const p of plugins ?? []) {
  const nom = p?.slug ?? '(sans slug)';
  if (!p?.slug || !/^[a-z0-9-]+$/.test(p.slug)) {
    erreurs.push(`${nom} : slug absent ou mal formé (minuscules et tirets)`);
  }
  if (vus.has(p?.slug)) erreurs.push(`${nom} : slug en double`);
  vus.add(p?.slug);

  // La version sert aussi à construire la clé R2 : une version vide ou
  // fantaisiste rendrait tous les téléchargements du plugin introuvables.
  if (!p?.version || !/^\d+\.\d+\.\d+$/.test(p.version)) {
    erreurs.push(`${nom} : version « ${p?.version} » attendue au format X.Y.Z`);
  }

  for (const os of ['macos', 'windows']) {
    const d = p?.downloads?.[os];
    if (!d?.file) erreurs.push(`${nom} : fichier d'installation ${os} manquant`);
    else if (!d.file.includes(p.version)) {
      erreurs.push(`${nom} : le fichier ${os} (${d.file}) ne porte pas la version ${p.version}`);
    }
  }
}

if (erreurs.length) {
  console.error('\x1b[31m✗ données plugins incohérentes :\x1b[0m');
  for (const e of erreurs) console.error(`  • ${e}`);
  process.exit(1);
}

console.log(`\x1b[32m✓\x1b[0m données plugins cohérentes (${plugins.length} plugins)`);
