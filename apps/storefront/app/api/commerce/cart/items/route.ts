import { NextResponse } from "next/server"
import { z } from "zod"
import { addToCart, createCart, revalidateProducts } from "@workspace/commerce"
import { errorResponse } from "@/lib/api"
import { getCartId, setCartId } from "@/lib/cart-cookie"
import { resolveTenantId } from "@/lib/tenant"

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().default(1),
})

export async function POST(request: Request) {
  try {
    const input = addSchema.parse(await request.json())
    const tenantId = await resolveTenantId()

    let id = await getCartId()
    if (!id) {
      const cart = await createCart(tenantId)
      id = cart.id
      await setCartId(id)
    }

    try {
      const cart = await addToCart(id, input, tenantId)
      revalidateProducts(tenantId)
      return NextResponse.json({ cart })
    } catch {
      // Cart expired/deleted — create a fresh one and retry once.
      const fresh = await createCart(tenantId)
      await setCartId(fresh.id)
      const cart = await addToCart(fresh.id, input, tenantId)
      revalidateProducts(tenantId)
      return NextResponse.json({ cart })
    }
  } catch (err) {
    return errorResponse(err)
  }
}
