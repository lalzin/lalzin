/**
 * ════════════════════════════════════════════════════════════════════
 *  CLOUDFLARE R2 — fichiers d'installation (bucket privé)
 * ════════════════════════════════════════════════════════════════════
 *  Les .pkg / .exe ne sont JAMAIS dans public/ (35 Mo pièce) : ils vivent
 *  dans un bucket R2 privé. Le site ne sert que des URLs présignées de
 *  15 minutes, générées à la volée après vérification du jeton.
 *
 *  Clés serveur uniquement (jamais NEXT_PUBLIC).
 * ════════════════════════════════════════════════════════════════════
 */
import { GetObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET;

/**
 * Endpoint du bucket. Deux façons de le renseigner :
 *  - R2_ENDPOINT : l'URL « S3 API » affichée par Cloudflare, collée telle
 *    quelle (le nom du bucket à la fin est retiré automatiquement). C'est
 *    la seule option correcte pour un bucket en juridiction européenne,
 *    dont l'hôte est <account>.eu.r2.cloudflarestorage.com ;
 *  - sinon R2_ACCOUNT_ID, et l'endpoint standard est reconstruit.
 */
export const endpoint = (() => {
  const raw = process.env.R2_ENDPOINT?.trim();
  if (raw) {
    try {
      // Garde le schéma + l'hôte, jette le /<bucket> éventuel.
      return new URL(raw.startsWith('http') ? raw : `https://${raw}`).origin;
    } catch {
      return undefined;
    }
  }
  return accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined;
})();

export const r2Configured = Boolean(endpoint && accessKeyId && secretAccessKey && bucket);

export const PRESIGN_TTL_SEC = 15 * 60;

let cached: S3Client | null = null;

function client(): S3Client | null {
  if (!r2Configured) return null;
  if (!cached) {
    cached = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId: accessKeyId as string, secretAccessKey: secretAccessKey as string },
    });
  }
  return cached;
}

/**
 * URL présignée (15 min) pour une clé du bucket.
 * `filename` force un nom de fichier propre côté navigateur.
 */
export async function presignDownload(key: string, filename: string): Promise<string | null> {
  const s3 = client();
  if (!s3) return null;
  const command = new GetObjectCommand({
    Bucket: bucket as string,
    Key: key,
    ResponseContentDisposition: `attachment; filename="${filename}"`,
  });
  return getSignedUrl(s3, command, { expiresIn: PRESIGN_TTL_SEC });
}
