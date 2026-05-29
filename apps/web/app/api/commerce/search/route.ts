import { NextResponse } from "next/server"
import { getProducts } from "@workspace/commerce"
import { errorResponse } from "@/lib/api"

export async function GET(request: Request) {
  try {
    const query = new URL(request.url).searchParams.get("q")?.trim()
    if (!query) return NextResponse.json({ products: [] })
    const result = await getProducts({ query, perPage: 8 })
    return NextResponse.json({ products: result.products.items })
  } catch (err) {
    return errorResponse(err)
  }
}
