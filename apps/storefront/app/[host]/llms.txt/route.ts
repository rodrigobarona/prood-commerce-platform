import { getCategories, getStore } from "@/lib/catalog"
import { llmsTxt } from "@/lib/markdown"
import { storeOrigin } from "@/lib/store-host"
import { tenantIdForHost } from "@/lib/tenant"

export async function GET(_request: Request, { params }: RouteContext<"/[host]/llms.txt">) {
  const { host } = await params
  if (!(await tenantIdForHost(host))) return new Response(null, { status: 404 })
  const [store, categories] = await Promise.all([getStore(host), getCategories(host)])
  const body = llmsTxt({
    store,
    categories,
    origin: storeOrigin(host),
    docsUrl: process.env.NEXT_PUBLIC_DOCS_URL?.replace(/\/$/, ""),
  })
  return new Response(body, { headers: { "content-type": "text/markdown; charset=utf-8" } })
}
