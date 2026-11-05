import { sitemapIndex } from "@/lib/sitemap"
import { tenantIdForHost } from "@/lib/tenant"

export async function GET(_request: Request, { params }: RouteContext<"/[host]/sitemap.xml">) {
  const { host } = await params
  if (!(await tenantIdForHost(host))) return new Response(null, { status: 404 })
  return sitemapIndex(host)
}
