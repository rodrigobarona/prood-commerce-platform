import { NextResponse } from "next/server"
import { z } from "zod"
import { unwrap } from "@prood/api-client"
import { CommerceError } from "@prood/types"
import { errorResponse } from "@/lib/api"
import { getCartId } from "@/lib/cart-cookie"
import { getCommerceApi } from "@/lib/commerce-api"

const bodySchema = z.object({ methodId: z.string().min(1) })

export async function PUT(request: Request) {
  try {
    const cartId = await getCartId()
    if (!cartId) throw new CommerceError("No active cart", "NOT_FOUND", 404)
    const { methodId } = bodySchema.parse(await request.json())
    const api = await getCommerceApi()
    const cart = await unwrap(
      api.PATCH("/carts/{id}/shipping-method", {
        params: { path: { id: cartId } },
        body: { methodId },
      })
    )
    return NextResponse.json({ cart })
  } catch (err) {
    return errorResponse(err)
  }
}
