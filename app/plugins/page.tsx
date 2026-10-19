import type { Metadata } from 'next';
import { defaultContent } from '@/lib/content';
import { suite, suiteImage } from '@/lib/plugins';
import PluginsIndex from './PluginsIndex';

const { site, artist } = defaultContent;

export const metadata: Metadata = {
  title: `${suite.name} · plugins gratuits`,
  description: `${suite.tagline.fr} ${suite.name} par ${artist.name} : VST3, AU et Standalone, macOS et Windows.`,
  alternates: { canonical: '/plugins' },
  openGraph: {
    type: 'website',
    title: `${suite.name} · ${artist.name}`,
    description: suite.tagline.fr,
    url: `${site.url}/plugins`,
    images: [{ url: suiteImage(suite.images.og), width: 1200, height: 630, alt: suite.name }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${suite.name} · ${artist.name}`,
    description: suite.tagline.fr,
    images: [suiteImage(suite.images.og)],
  },
};

export default function PluginsPage() {
  return <PluginsIndex />;
}
