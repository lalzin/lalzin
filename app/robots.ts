import type { MetadataRoute } from 'next';
import { defaultContent } from '@/lib/content';

export default function robots(): MetadataRoute.Robots {
  const base = defaultContent.site.url;
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api/'],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
