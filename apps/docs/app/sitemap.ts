import type { MetadataRoute } from 'next';
import { source } from '@/lib/source';

const origin = process.env.NEXT_PUBLIC_DOCS_URL?.replace(/\/$/, '') ?? 'https://docs.prood.com';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: origin, priority: 1 },
    ...source.getPages().map((page) => ({ url: `${origin}${page.url}`, priority: 0.7 })),
  ];
}
