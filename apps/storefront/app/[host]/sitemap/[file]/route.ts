import { sitemapEntries, sitemapFile } from "@/lib/sitemap"
import { tenantIdForHost } from "@/lib/tenant"

export async function GET(_request: Request, { params }: RouteContext<"/[host]/sitemap/[file]">) {
  const { host, file } = await params
  const entries = (await tenantIdForHost(host)) ? await sitemapEntries(host, file) : null
  if (!entries) return new Response(null, { status: 404 })
  return sitemapFile(host, entries)
}
