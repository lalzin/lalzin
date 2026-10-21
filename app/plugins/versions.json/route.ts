/**
 * ════════════════════════════════════════════════════════════════════
 *  GET /plugins/versions.json — fichier lu par les plugins installés
 * ════════════════════════════════════════════════════════════════════
 *  Généré à partir de la configuration de /admin, et non d'un fichier
 *  du dépôt : changer une version dans l'admin suffit, sans déploiement.
 *  C'est la même source que la page produit et que le chemin cherché
 *  dans R2, donc les trois ne peuvent plus diverger.
 *
 *  Le format est figé : les plugins le lisent tel quel.
 *    { "updated": "AAAA-MM-JJ",
 *      "plugins": { "<slug>": { "version": "0.1.0", "url": "https://…" } } }
 * ════════════════════════════════════════════════════════════════════
 */
import { NextResponse } from 'next/server';
import { ALL_PLUGINS } from '@/lib/plugins';
import { getPluginConfig, merge } from '@/lib/pluginConfig';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Domaine écrit en toutes lettres : les plugins ouvrent ces URLs
 * directement, autant leur éviter la redirection de lalzin.com vers www.
 */
const BASE = 'https://www.lalzin.com';

export async function GET() {
  const config = await getPluginConfig();

  const plugins: Record<string, { version: string; url: string }> = {};
  for (const base of ALL_PLUGINS) {
    const plugin = merge(base, config.bySlug[base.slug]);
    const enLigne = config.published.includes(plugin.slug);
    plugins[plugin.slug] = {
      version: plugin.version,
      // Un plugin retiré du site renvoie vers la suite plutôt que vers
      // une page qui n'existe plus : une copie installée garde une sortie.
      url: enLigne ? `${BASE}/plugins/${plugin.slug}` : `${BASE}/plugins`,
    };
  }

  return NextResponse.json(
    { updated: new Date().toISOString().slice(0, 10), plugins },
    {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
}
