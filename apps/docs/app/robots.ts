import type { MetadataRoute } from 'next';

import { docsOrigin as origin } from '@/lib/shared';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
