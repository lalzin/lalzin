/**
 * Aperçu de l'email de téléchargement — DÉVELOPPEMENT UNIQUEMENT.
 * http://localhost:3011/dev/email          (français)
 * http://localhost:3011/dev/email?lang=en  (anglais)
 * http://localhost:3011/dev/email?text=1   (version texte envoyée en parallèle)
 *
 * Renvoie 404 en production : cette route n'existe que pour relire le rendu
 * sans avoir à configurer Resend. Supprimable sans rien casser.
 */
import { render } from '@react-email/components';
import { NextResponse } from 'next/server';
import DownloadEmail, { downloadEmailText, type DownloadEmailProps } from '@/components/email/DownloadEmail';
import { defaultContent } from '@/lib/content';
import { paypalUrl } from '@/lib/publicConfig';
import { availableOS, formatBytes, pluginEmailImage } from '@/lib/plugins';
import { getPlugin } from '@/lib/pluginConfig';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new NextResponse('Not found', { status: 404 });
  }

  const { searchParams, origin } = new URL(req.url);
  const lang = searchParams.get('lang') === 'en' ? 'en' : 'fr';
  const slug = searchParams.get('p') ?? 'french-filter';

  const plugin = await getPlugin(slug);
  if (!plugin) return new NextResponse('Plugin inconnu', { status: 404 });

  const token = 'APERCU-SANS-JETON-REEL';
  const props: DownloadEmailProps = {
    lang,
    siteUrl: origin,
    items: [
      {
        plugin,
        image: `${origin}${pluginEmailImage(plugin.slug)}`,
        links: availableOS(plugin).map((os) => ({
          os,
          href: `${origin}/api/plugins/download?t=${token}&p=${plugin.slug}&os=${os}`,
          size: formatBytes(plugin.downloads[os].bytes, lang),
        })),
      },
    ],
    installUrl: `${origin}/plugins/installation`,
    instagramUrl: defaultContent.socials.find((s) => s.key === 'instagram')?.href ?? null,
    paypalUrl: paypalUrl(),
    bookingEmail: defaultContent.artist.bookingEmail,
  };

  if (searchParams.get('text')) {
    return new NextResponse(downloadEmailText(props), {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }

  const html = await render(DownloadEmail(props));
  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
