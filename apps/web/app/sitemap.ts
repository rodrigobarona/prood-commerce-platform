import type { MetadataRoute } from "next"

import { pages } from "@/lib/pages"
import { siteConfig } from "@/lib/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return Object.values(pages).map(({ path, priority }) => ({
    url: `${siteConfig.url}${path === "/" ? "" : path}`,
    priority,
  }))
}
