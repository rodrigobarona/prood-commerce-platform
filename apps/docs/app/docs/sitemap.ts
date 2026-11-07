import type { MetadataRoute } from 'next';
import { docsOrigin as origin } from '@/lib/shared';
import { source } from '@/lib/source';

/** Served at /docs/sitemap.xml, inside this zone. The robots.txt of apps/web has to list it. */
export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({ url: `${origin}${page.url}`, priority: 0.7 }));
}
