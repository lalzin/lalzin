import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { defaultContent } from '@/lib/content';
import { ALL_PLUGINS, suite, suiteImage } from '@/lib/plugins';
import { getPublishedSlugs, getSuite } from '@/lib/pluginConfig';
import { turnstileSiteKey } from '@/lib/publicConfig';
import SuitePage from './SuitePage';

const { site, artist } = defaultContent;
const description = `Les ${ALL_PLUGINS.length} plugins ${suite.name} de ${artist.name} en un seul installateur gratuit : VST3, AU et Standalone, macOS et Windows.`;

export const metadata: Metadata = {
  title: `${suite.name}, toute la suite · plugins gratuits`,
  description,
  alternates: { canonical: '/plugins/suite' },
  openGraph: {
    type: 'website',
    title: `${suite.name}, toute la suite · ${artist.name}`,
    description,
    url: `${site.url}/plugins/suite`,
    images: [{ url: suiteImage(suite.images.og), width: 1200, height: 630, alt: suite.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${suite.name}, toute la suite · ${artist.name}`,
    description,
    images: [suiteImage(suite.images.og)],
  },
};

/** La page n'existe que si l'installateur de la suite est publié dans /admin. */
export default async function Page({ searchParams }: { searchParams: { expire?: string } }) {
  const [suiteDl, publies] = await Promise.all([getSuite(), getPublishedSlugs()]);
  if (!suiteDl) notFound();

  return (
    <SuitePage
      suiteDl={suiteDl}
      publies={publies}
      expired={searchParams?.expire === '1'}
      turnstileSiteKey={turnstileSiteKey}
    />
  );
}
