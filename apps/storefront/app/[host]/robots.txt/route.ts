import { storeOrigin } from "@/lib/store-host"
import { tenantIdForHost } from "@/lib/tenant"

const PRIVATE = ["/account", "/api", "/cart", "/checkout", "/order-confirmation"]

export async function GET(_request: Request, { params }: RouteContext<"/[host]/robots.txt">) {
  const { host } = await params
  if (!(await tenantIdForHost(host))) return new Response(null, { status: 404 })
  const origin = storeOrigin(host)
  const body = [
    "User-agent: *",
    "Allow: /",
    ...PRIVATE.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${origin}/sitemap.xml`,
    "",
  ].join("\n")
  return new Response(body, { headers: { "content-type": "text/plain; charset=utf-8" } })
}
