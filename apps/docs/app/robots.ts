import type { MetadataRoute } from 'next';

const origin = process.env.NEXT_PUBLIC_DOCS_URL?.replace(/\/$/, '') ?? 'https://docs.prood.com';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${origin}/sitemap.xml`,
    host: origin,
  };
}
