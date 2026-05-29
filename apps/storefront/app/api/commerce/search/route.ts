import { NextResponse } from "next/server"
import { getProducts } from "@workspace/commerce"
import { errorResponse } from "@/lib/api"
import { resolveTenantId } from "@/lib/tenant"

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim()
    if (!query) return NextResponse.json({ products: [] })
    const tenantId = await resolveTenantId()
    const result = await getProducts({ query, perPage: 8 }, tenantId)
    return NextResponse.json({ products: result.products.items })
  } catch (err) {
    return errorResponse(err)
  }
}
