/**
 * Helpers partagés par les routes /api/plugins/*.
 * (Fichier sans `route.ts` : jamais exposé comme endpoint.)
 */
import { defaultContent } from '@/lib/content';
import { paypalUrl } from '@/lib/publicConfig';
import type { Lang } from '@/lib/content';
import type { DownloadEmailProps } from '@/components/email/DownloadEmail';
import {
  availableOS,
  formatBytes,
  getPlugin,
  pluginEmailImage,
  type OS,
} from '@/lib/plugins';

/** IP du visiteur derrière le proxy Vercel. */
export function clientIP(req: Request): string | null {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip');
}

/** Origine publique du site (préférée à l'URL interne de la requête). */
export function siteOrigin(req: Request): string {
  const configured = defaultContent.site.url;
  if (/^https:\/\//.test(configured) && !configured.includes('localhost')) return configured;
  try {
    return new URL(req.url).origin;
  } catch {
    return configured;
  }
}

/**
 * Construit le contenu de l'email : un bloc par plugin demandé, avec le lien
 * de l'OS choisi d'abord, puis les autres OS disponibles (même machine, autre
 * poste de travail…).
 */
export function buildEmailProps(params: {
  slugs: string[];
  os: OS;
  lang: Lang;
  token: string;
  origin: string;
}): DownloadEmailProps {
  const { slugs, os, lang, token, origin } = params;
  const donateUrl = paypalUrl();

  const items = slugs.flatMap((slug) => {
    const plugin = getPlugin(slug);
    if (!plugin) return [];

    const oses = availableOS(plugin).sort((a) => (a === os ? -1 : 1));
    const links = oses.map((o) => ({
      os: o,
      href: `${origin}/api/plugins/download?t=${encodeURIComponent(token)}&p=${slug}&os=${o}`,
      size: formatBytes(plugin.downloads[o].bytes, lang),
    }));

    return [{ plugin, image: `${origin}${pluginEmailImage(slug)}`, links }];
  });

  return {
    lang,
    siteUrl: origin,
    items,
    installUrl: `${origin}/plugins/installation`,
    paypalUrl: donateUrl,
    bookingEmail: defaultContent.artist.bookingEmail,
  };
}
