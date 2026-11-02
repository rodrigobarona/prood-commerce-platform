import type { MetadataRoute } from "next"
import { storeOrigin } from "@/lib/store-origin"
import { resolveTenantId } from "@/lib/tenant"

export default async function robots(): Promise<MetadataRoute.Robots> {
  await resolveTenantId()
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/account", "/api", "/cart", "/checkout", "/order-confirmation"],
    },
    sitemap: `${await storeOrigin()}/sitemap.xml`,
  }
}
