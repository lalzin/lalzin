/**
 * Vérifie la connexion au bucket R2 et le téléchargement d'un plugin.
 * Ne modifie rien, n'affiche aucun secret.
 *
 *   npm run check-r2
 *
 * Contrôle, dans l'ordre : variables présentes → accès au bucket →
 * présence du fichier attendu → URL présignée réellement téléchargeable.
 */
import { readFileSync } from 'node:fs';
import { HeadObjectCommand, ListObjectsV2Command, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

/* ----------------------------------------- .env.local (sans dépendance) */
try {
  for (const line of readFileSync(new URL('../.env.local', import.meta.url), 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
  }
} catch {
  /* pas de .env.local : on lira l'environnement courant */
}

const ok = (m) => console.log(`\x1b[32m✓\x1b[0m ${m}`);
const ko = (m) => console.log(`\x1b[31m✗\x1b[0m ${m}`);
const info = (m) => console.log(`  ${m}`);

const { R2_ENDPOINT, R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET } = process.env;

const endpoint = R2_ENDPOINT
  ? new URL(R2_ENDPOINT.startsWith('http') ? R2_ENDPOINT : `https://${R2_ENDPOINT}`).origin
  : R2_ACCOUNT_ID
    ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
    : null;

if (!endpoint || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET) {
  ko('Variables manquantes.');
  info('Il faut R2_ENDPOINT (ou R2_ACCOUNT_ID), R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET.');
  process.exit(1);
}
ok(`Variables présentes — endpoint ${endpoint}, bucket « ${R2_BUCKET} »`);

/* --------------------------------- Fichiers attendus d'après plugins.ts */
const data = JSON.parse(readFileSync(new URL('../lib/plugins.json', import.meta.url), 'utf8'));
const published = ['french-filter']; // doit refléter PUBLISHED_SLUGS
const attendus = data.plugins
  .filter((p) => published.includes(p.slug))
  .flatMap((p) =>
    Object.entries(p.downloads)
      .filter(([, d]) => Boolean(d.file))
      .map(([os, d]) => ({ plugin: p.name, os, key: `${p.slug}/${p.version}/${d.file}`, bytes: d.bytes })),
  );

const s3 = new S3Client({
  region: 'auto',
  endpoint,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

let echec = false;

/* ------------------------------------------------- 1. accès au bucket */
try {
  const res = await s3.send(new ListObjectsV2Command({ Bucket: R2_BUCKET, MaxKeys: 50 }));
  ok(`Bucket accessible — ${res.KeyCount ?? 0} objet(s)`);
  for (const o of res.Contents ?? []) info(`• ${o.Key}  (${(o.Size / 1e6).toFixed(1)} Mo)`);
} catch (e) {
  ko(`Bucket inaccessible : ${e.name} — ${e.message}`);
  info("Vérifie le nom du bucket, l'endpoint, et que le jeton a au moins « Object Read only ».");
  process.exit(1);
}

/* ------------------------------- 2. fichiers attendus + URL présignée */
for (const f of attendus) {
  try {
    const head = await s3.send(new HeadObjectCommand({ Bucket: R2_BUCKET, Key: f.key }));
    const taille = Number(head.ContentLength);
    ok(`${f.plugin} (${f.os}) : ${f.key} présent — ${(taille / 1e6).toFixed(1)} Mo`);
    if (Math.abs(taille - f.bytes) > 1024) {
      ko(`   taille différente de plugins.json (${(f.bytes / 1e6).toFixed(1)} Mo) : mets « bytes » à jour`);
      echec = true;
    }

    const url = await getSignedUrl(
      s3,
      new HeadObjectCommand({ Bucket: R2_BUCKET, Key: f.key }),
      { expiresIn: 900 },
    );
    const res = await fetch(url, { method: 'HEAD' });
    if (res.ok) ok(`   URL présignée valide (HTTP ${res.status})`);
    else {
      ko(`   URL présignée refusée (HTTP ${res.status})`);
      echec = true;
    }
  } catch (e) {
    ko(`${f.plugin} (${f.os}) : ${f.key} introuvable — ${e.name}`);
    info(`   Upload attendu : npx wrangler r2 object put "${R2_BUCKET}/${f.key}" --file <chemin> --remote`);
    echec = true;
  }
}

console.log(echec ? '\n\x1b[31mDes points sont à corriger.\x1b[0m' : '\n\x1b[32mR2 est prêt.\x1b[0m');
process.exit(echec ? 1 : 0);
