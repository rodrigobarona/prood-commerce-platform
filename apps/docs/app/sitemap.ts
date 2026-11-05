import type { MetadataRoute } from 'next';
import { docsOrigin as origin } from '@/lib/shared';
import { source } from '@/lib/source';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: origin, priority: 1 },
    ...source.getPages().map((page) => ({ url: `${origin}${page.url}`, priority: 0.7 })),
  ];
}
