/**
 * Refuse le build tant que les mentions légales contiennent un champ
 * « À COMPLÉTER » (lib/legal.ts) : on ne publie pas des mentions vides.
 */
import { readFileSync } from 'node:fs';

const src = readFileSync(new URL('../lib/legal.ts', import.meta.url), 'utf8');
const manquants = [...src.matchAll(/^\s*(\w+):\s*A_COMPLETER,/gm)].map((m) => m[1]);

if (manquants.length) {
  console.error(`\x1b[31m✗\x1b[0m Mentions légales incomplètes (lib/legal.ts) : ${manquants.join(', ')}`);
  process.exit(1);
}
console.log('\x1b[32m✓\x1b[0m mentions légales complètes');
