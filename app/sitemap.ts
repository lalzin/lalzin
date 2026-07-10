import type { MetadataRoute } from 'next';
import { defaultContent } from '@/lib/content';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = defaultContent.site.url;
  const now = new Date();
  return [
    { url: `${base}/`, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/links`, lastModified: now, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
