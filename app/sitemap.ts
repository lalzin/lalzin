import type { MetadataRoute } from 'next';
import { defaultContent } from '@/lib/content';
import { getPublishedSlugs } from '@/lib/pluginConfig';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = defaultContent.site.url;
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/plugins`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    ...(await getPublishedSlugs()).map((slug) => ({
      url: `${base}/plugins/${slug}`,
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    { url: `${base}/plugins/installation`, lastModified: now, changeFrequency: 'monthly' as const, priority: 0.5 },
    { url: `${base}/links`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/confidentialite`, lastModified: now, changeFrequency: 'yearly', priority: 0.3 },
  ];
}
