import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { defaultContent } from '@/lib/content';
import { availableOS, pluginImage, OS_LABEL } from '@/lib/plugins';
import { getPlugin, getPlugins, getPublishedSlugs } from '@/lib/pluginConfig';
import { turnstileSiteKey } from '@/lib/publicConfig';
import PluginDetail from './PluginDetail';

const { site, artist } = defaultContent;

type Params = { params: { slug: string } };

export async function generateStaticParams() {
  return (await getPublishedSlugs()).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const plugin = await getPlugin(params.slug);
  if (!plugin) return {};

  const og = pluginImage(plugin.slug, 'og.webp');
  const description = plugin.description.fr;

  return {
    title: `${plugin.name} · plugin gratuit`,
    description,
    alternates: { canonical: `/plugins/${plugin.slug}` },
    openGraph: {
      type: 'website',
      title: `${plugin.name} · ${plugin.tagline.fr}`,
      description,
      url: `${site.url}/plugins/${plugin.slug}`,
      images: [{ url: og, width: 1200, height: 630, alt: plugin.name }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${plugin.name} · ${artist.name}`,
      description,
      images: [og],
    },
  };
}

export default async function PluginPage({
  params,
  searchParams,
}: Params & { searchParams: { expire?: string } }) {
  const plugin = await getPlugin(params.slug);
  if (!plugin) notFound();

  const oses = availableOS(plugin);

  // JSON-LD : application logicielle gratuite
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: plugin.name,
    applicationCategory: 'MultimediaApplication',
    applicationSubCategory: plugin.type === 'instrument' ? 'Instrument' : 'Audio effect',
    operatingSystem: oses.map((os) => OS_LABEL[os]).join(', ') || 'macOS',
    softwareVersion: plugin.version,
    description: plugin.description.en,
    url: `${site.url}/plugins/${plugin.slug}`,
    image: `${site.url}${pluginImage(plugin.slug, 'og.webp')}`,
    author: { '@type': 'Person', name: artist.name, url: site.url },
    publisher: { '@type': 'Person', name: artist.name, url: site.url },
    offers: { '@type': 'Offer', price: 0, priceCurrency: 'EUR' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PluginDetail
        plugin={plugin}
        expired={searchParams?.expire === '1'}
        turnstileSiteKey={turnstileSiteKey}
        others={(await getPlugins()).filter((p) => p.slug !== plugin.slug)}
      />
    </>
  );
}
