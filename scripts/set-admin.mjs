/**
 * Configure les identifiants admin de façon sécurisée.
 *
 *   npm run set-admin                      → demande le mot de passe
 *   npm run set-admin -- "MonMotDePasse"   → mot de passe en argument
 *   npm run set-admin -- "MonMotDePasse" "monidentifiant"
 *
 * Écrit ADMIN_USERNAME, ADMIN_PASSWORD_HASH et AUTH_SECRET dans .env.local
 * (le mot de passe en clair n'est jamais stocké). Affiche aussi les valeurs
 * à copier dans Vercel → Settings → Environment Variables.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { webcrypto as crypto } from 'node:crypto';

const ITER = 100_000;
const enc = new TextEncoder();
const b64url = (u8) =>
  Buffer.from(u8).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: ITER, hash: 'SHA-256' }, key, 256);
  return `${ITER}.${b64url(salt)}.${b64url(new Uint8Array(bits))}`;
}

function readEnv(path) {
  const map = {};
  if (existsSync(path)) {
    for (const line of readFileSync(path, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (m) map[m[1]] = m[2];
    }
  }
  return map;
}

const args = process.argv.slice(2);
let password = args[0];
const username = args[1] || 'lalzin';

if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = await rl.question('Nouveau mot de passe admin : ');
  rl.close();
}
if (!password || password.length < 8) {
  console.error('\n❌ Mot de passe trop court (8 caractères minimum).');
  process.exit(1);
}

const envPath = '.env.local';
const env = readEnv(envPath);
// Conserve un AUTH_SECRET existant, sinon en génère un nouveau (64 hex).
const secret = env.AUTH_SECRET || Buffer.from(crypto.getRandomValues(new Uint8Array(32))).toString('hex');
const hash = await hashPassword(password);

env.ADMIN_USERNAME = username;
env.ADMIN_PASSWORD_HASH = hash;
env.AUTH_SECRET = secret;
delete env.ADMIN_PASSWORD; // on n'utilise plus le mot de passe en clair

const out = Object.entries(env)
  .map(([k, v]) => `${k}=${v}`)
  .join('\n');
writeFileSync(envPath, out + '\n');

console.log(`\n✅ Identifiants enregistrés dans ${envPath} (le mot de passe en clair n'est PAS stocké).`);
console.log('\n──────────── À copier dans Vercel (Environment Variables) ────────────');
console.log(`ADMIN_USERNAME=${username}`);
console.log(`ADMIN_PASSWORD_HASH=${hash}`);
console.log(`AUTH_SECRET=${secret}`);
console.log('──────────────────────────────────────────────────────────────────────');
console.log(`\nIdentifiant : ${username}`);
console.log('Mot de passe : (celui que tu viens de saisir — garde-le, il est irrécupérable)\n');
