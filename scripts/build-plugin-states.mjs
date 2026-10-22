/**
 * Recense les visuels de chaque plugin dans lib/pluginStates.json :
 *  - « states » : les écrans de la galerie (ui-*.webp, hors hero et hors @3x) ;
 *  - « images » : les dimensions réelles de chaque visuel.
 *
 * Les dimensions ne sont plus écrites en dur dans les composants : les
 * fenêtres n'ont pas toutes le même format (Kick Lock est en paysage
 * 1520 x 960 quand les autres sont en portrait 840 x 1040), et une taille
 * fausse déforme l'image ou réserve la mauvaise place pendant le chargement.
 *
 * Lecture des en-têtes WebP en JavaScript pur : le script tourne aussi sur
 * le serveur de build, où aucun outil d'image n'est disponible.
 *
 * Lancé avant `npm run build` et `npm run dev`.
 */
import { readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const racine = fileURLToPath(new URL('../public/images/plugins/', import.meta.url));
const sortie = fileURLToPath(new URL('../lib/pluginStates.json', import.meta.url));

/**
 * Dimensions d'un WebP, lues dans l'en-tête RIFF.
 * Trois encodages possibles : VP8X (étendu), VP8 (avec perte), VP8L (sans perte).
 */
function tailleWebp(chemin) {
  const b = readFileSync(chemin);
  if (b.toString('ascii', 0, 4) !== 'RIFF' || b.toString('ascii', 8, 12) !== 'WEBP') return null;
  const type = b.toString('ascii', 12, 16);

  if (type === 'VP8X') {
    return [1 + b.readUIntLE(24, 3), 1 + b.readUIntLE(27, 3)];
  }
  if (type === 'VP8 ') {
    // 3 octets de frame tag, puis le code de synchronisation 9d 01 2a
    if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
    return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff];
  }
  if (type === 'VP8L') {
    if (b[20] !== 0x2f) return null;
    const bits = b.readUInt32LE(21);
    return [1 + (bits & 0x3fff), 1 + ((bits >> 14) & 0x3fff)];
  }
  return null;
}

const manifeste = {};

for (const slug of readdirSync(racine, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name)
  .sort()) {
  const dossier = join(racine, slug);
  if (!existsSync(dossier)) continue;

  const webp = readdirSync(dossier).filter((f) => f.endsWith('.webp'));

  const images = {};
  for (const f of webp) {
    const taille = tailleWebp(join(dossier, f));
    if (taille) images[f] = taille;
    else console.warn(`[états] dimensions illisibles : ${slug}/${f}`);
  }

  // Galerie : les écrans, sans le hero ni les variantes @3x (même image en plus grand).
  const states = webp
    .filter((f) => /^ui-/.test(f) && !/^ui-hero/.test(f) && !/@3x\./.test(f))
    .sort((a, b) => a.localeCompare(b, 'fr', { numeric: true }));

  manifeste[slug] = { states, images };
}

writeFileSync(sortie, `${JSON.stringify(manifeste, null, 2)}\n`);

console.log(`[états] ${Object.keys(manifeste).length} plugins :`);
for (const [slug, { states, images }] of Object.entries(manifeste)) {
  const hero = images['ui-hero.webp'];
  console.log(
    `  ${slug.padEnd(14)} hero ${hero ? `${hero[0]}x${hero[1]}`.padEnd(10) : '?'.padEnd(10)} galerie : ${states.join(', ') || '(aucune)'}`,
  );
}
