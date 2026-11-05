import { NextResponse } from "next/server"
import { errorResponse } from "@/lib/api"
import { getProducts } from "@/lib/catalog"
import { requestHost } from "@/lib/store-host"

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim()
    if (!query) return NextResponse.json({ products: [] })
    const { products } = await getProducts(await requestHost(), { query, perPage: 8 })
    return NextResponse.json({ products: products.items })
  } catch (err) {
    return errorResponse(err)
  }
}
