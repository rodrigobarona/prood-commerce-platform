import { NextResponse } from "next/server"
import { z } from "zod"
import { addToCart, createCart, revalidateProducts } from "@workspace/commerce"
import { errorResponse } from "@/lib/api"
import { getCartId, setCartId } from "@/lib/cart-cookie"

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().default(1),
})

export async function POST(request: Request) {
  try {
    const input = addSchema.parse(await request.json())

    let id = await getCartId()
    if (!id) {
      const cart = await createCart()
      id = cart.id
      await setCartId(id)
    }

    try {
      const cart = await addToCart(id, input)
      revalidateProducts()
      return NextResponse.json({ cart })
    } catch {
      // Cart expired/deleted — create a fresh one and retry once.
      const fresh = await createCart()
      await setCartId(fresh.id)
      const cart = await addToCart(fresh.id, input)
      revalidateProducts()
      return NextResponse.json({ cart })
    }
  } catch (err) {
    return errorResponse(err)
  }
}
