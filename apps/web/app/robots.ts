import type { MetadataRoute } from "next"

import { DASHBOARD_SEGMENTS } from "@/lib/zones"
import { siteConfig } from "@/lib/site"

export default function robots(): MetadataRoute.Robots {
  return {
    // The dashboard answers on these paths and is private; the pages under them say noindex too.
    rules: { userAgent: "*", allow: "/", disallow: ["/home", "/admin", ...DASHBOARD_SEGMENTS.map((segment) => `/${segment}`)] },
    sitemap: [`${siteConfig.url}/sitemap.xml`, `${siteConfig.url}/docs/sitemap.xml`],
    host: siteConfig.url,
  }
}
