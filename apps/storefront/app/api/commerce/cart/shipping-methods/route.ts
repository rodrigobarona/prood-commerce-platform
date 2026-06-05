import { NextResponse } from "next/server"
import { CommerceError } from "@prood/types"
import { errorResponse } from "@/lib/api"
import { getCartId } from "@/lib/cart-cookie"
import { getCommerceApi } from "@/lib/commerce-api"

export async function GET() {
  try {
    const cartId = await getCartId()
    if (!cartId) throw new CommerceError("No active cart", "NOT_FOUND", 404)
    const api = await getCommerceApi()
    const { data, error } = await api.GET("/carts/{id}/shipping-methods", {
      params: { path: { id: cartId } },
    })
    if (error) throw error
    return NextResponse.json({ methods: data ?? [] })
  } catch (err) {
    return errorResponse(err)
  }
}
