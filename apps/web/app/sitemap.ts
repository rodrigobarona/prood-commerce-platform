import type { MetadataRoute } from "next"

import { siteConfig } from "@/lib/site"

const routes = [
  { path: "", priority: 1 },
  { path: "/pricing", priority: 0.9 },
  { path: "/agencies", priority: 0.8 },
  { path: "/developers", priority: 0.8 },
  { path: "/integrations", priority: 0.8 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, priority }) => ({
    url: `${siteConfig.url}${path}`,
    priority,
  }))
}
