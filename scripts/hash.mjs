/**
 * Affiche le hash PBKDF2-SHA256 d'un mot de passe (même format que l'app).
 * Ne modifie aucun fichier — sert juste à obtenir un ADMIN_PASSWORD_HASH.
 *
 *   npm run hash                 → demande le mot de passe (saisie masquée)
 *   npm run hash -- "MonPass"    → mot de passe en argument
 */
import { webcrypto as crypto } from 'node:crypto';
import { emitKeypressEvents } from 'node:readline';

const ITER = 100_000;
const enc = new TextEncoder();
const b64url = (u8) =>
  Buffer.from(u8).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' },
    key,
    256,
  );
  return `${ITER}.${b64url(salt)}.${b64url(new Uint8Array(bits))}`;
}

/** Saisie masquée (aucun caractère affiché). */
function askHidden(prompt) {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    stdout.write(prompt);
    emitKeypressEvents(stdin);
    if (stdin.isTTY) stdin.setRawMode(true);
    let pw = '';
    const onKey = (ch, key) => {
      if (key && (key.name === 'return' || key.name === 'enter')) {
        if (stdin.isTTY) stdin.setRawMode(false);
        stdin.removeListener('keypress', onKey);
        stdin.pause();
        stdout.write('\n');
        resolve(pw);
      } else if (key && key.name === 'backspace') {
        pw = pw.slice(0, -1);
      } else if (key && key.ctrl && key.name === 'c') {
        process.exit(1);
      } else if (ch) {
        pw += ch;
      }
    };
    stdin.on('keypress', onKey);
    stdin.resume();
  });
}

let pw = process.argv[2];
if (!pw) pw = await askHidden('Mot de passe : ');
if (!pw) {
  console.error('Aucun mot de passe fourni.');
  process.exit(1);
}
console.log('\nADMIN_PASSWORD_HASH=' + (await hashPassword(pw)) + '\n');
