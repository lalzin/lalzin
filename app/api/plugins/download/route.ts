/**
 * ════════════════════════════════════════════════════════════════════
 *  GET /api/plugins/download?t=<jeton>&p=<slug>&os=<macos|windows>
 * ════════════════════════════════════════════════════════════════════
 *  Jeton HMAC valide → compteur incrémenté → redirection 302 vers une
 *  URL R2 présignée de 15 minutes. Jeton invalide ou expiré → page
 *  « lien expiré », qui propose d'en redemander un.
 * ════════════════════════════════════════════════════════════════════
 */
import { NextResponse } from 'next/server';
import { verifyDownloadToken } from '@/lib/downloadToken';
import { logDownload } from '@/lib/pluginRequests';
import { getPlugin, isOSAvailable, r2Key, type OS } from '@/lib/plugins';
import { objectExists, presignDownload, r2Configured } from '@/lib/r2';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Page de secours : le formulaire de la page plugin, avec un bandeau. */
function expired(req: Request, slug: string | null) {
  const target = slug ? `/plugins/${slug}?expire=1#telecharger` : '/plugins?expire=1';
  return NextResponse.redirect(new URL(target, req.url), 302);
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('t');
  const slug = searchParams.get('p');
  const os = searchParams.get('os') as OS | null;

  const plugin = slug ? getPlugin(slug) : undefined;
  if (!plugin || (os !== 'macos' && os !== 'windows') || !isOSAvailable(plugin, os)) {
    return expired(req, null);
  }

  const claims = await verifyDownloadToken(token);
  if (!claims || !claims.p.includes(plugin.slug)) {
    return expired(req, plugin.slug);
  }

  if (!r2Configured) {
    return NextResponse.json(
      { ok: false, error: 'Stockage des fichiers non configuré (R2_*)' },
      { status: 503 },
    );
  }

  // Le build n'est pas encore en ligne : message clair plutôt qu'une erreur XML.
  const key = r2Key(plugin, os);
  if (!(await objectExists(key))) {
    return NextResponse.redirect(
      new URL(`/plugins/${plugin.slug}?indisponible=1#telecharger`, req.url),
      302,
    );
  }

  const url = await presignDownload(key, plugin.downloads[os].file);
  if (!url) {
    return NextResponse.json({ ok: false, error: 'Fichier indisponible' }, { status: 503 });
  }

  await logDownload({
    requestId: claims.r,
    plugin: plugin.slug,
    os,
    version: plugin.version,
  });

  return NextResponse.redirect(url, 302);
}
