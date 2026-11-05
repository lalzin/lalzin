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

// Installateur de la suite : même règle que pour un plugin.
const s = lire('../lib/plugins.json').suite;
if (s?.downloads) {
  if (!s.version || !/^\d+\.\d+\.\d+$/.test(s.version)) {
    erreurs.push(`suite : version « ${s.version} » attendue au format X.Y.Z`);
  }
  for (const os of ['macos', 'windows']) {
    const f = s.downloads[os]?.file;
    if (!f) erreurs.push(`suite : fichier d'installation ${os} manquant`);
    else if (s.version && !f.includes(s.version)) {
      erreurs.push(`suite : le fichier ${os} (${f}) ne porte pas la version ${s.version}`);
    }
  }
}

// Typographie : pas de tiret cadratin dans les textes affichés (choix
// éditorial du site). Les exports de groove-knobs en réintroduisent : le
// build le signale plutôt que de laisser passer en silence.
const textes = (p) => [
  ['tagline', p.tagline],
  ['description', p.description],
  ['latency_note', p.latency_note],
  ...(p.features ? ['fr', 'en'].flatMap((l) => (p.features[l] ?? []).map((f, i) => [`features.${l}[${i}]`, { [l]: f }])) : []),
  ...(p.gallery ?? []).map((g) => [`gallery ${g.file}`, g.caption]),
];
for (const p of plugins ?? []) {
  for (const [champ, valeur] of textes(p)) {
    for (const [lang, t] of Object.entries(valeur ?? {})) {
      if (typeof t === 'string' && t.includes('—')) {
        erreurs.push(`${p.slug} : tiret cadratin dans ${champ}${champ.includes('.') ? '' : `.${lang}`}, à reformuler (lib/plugins.json et ../groove-knobs/web-assets/plugins.json)`);
      }
    }
  }
}

if (erreurs.length) {
  console.error('\x1b[31m✗ données plugins incohérentes :\x1b[0m');
  for (const e of erreurs) console.error(`  • ${e}`);
  process.exit(1);
}

console.log(`\x1b[32m✓\x1b[0m données plugins cohérentes (${plugins.length} plugins)`);
