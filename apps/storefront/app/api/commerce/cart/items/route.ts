import { NextResponse } from "next/server"
import { z } from "zod"
import { errorResponse } from "@/lib/api"
import { getCartId, setCartId } from "@/lib/cart-cookie"
import { getCommerceApi } from "@/lib/commerce-api"

const addSchema = z.object({
  productId: z.string().min(1),
  variantId: z.string().optional(),
  quantity: z.number().int().positive().default(1),
})

export async function POST(request: Request) {
  try {
    const input = addSchema.parse(await request.json())
    const api = await getCommerceApi()

    const createCart = async () => {
      const { data, error } = await api.POST("/carts")
      if (error || !data) throw error ?? new Error("Failed to create cart")
      await setCartId(data.id)
      return data.id
    }

    const add = (cartId: string) =>
      api.POST("/carts/{id}/items", {
        params: { path: { id: cartId } },
        body: input,
      })

    const id = (await getCartId()) ?? (await createCart())
    const added = await add(id)
    if (!added.error) return NextResponse.json({ cart: added.data })

    // A 404 can also mean the product. Only a cart that is really gone is
    // replaced: any other failure leaves the shopper's cart and cookie alone.
    if (added.response.status !== 404) throw added.error
    const current = await api.GET("/carts/{id}", { params: { path: { id } } })
    if (current.response.status !== 404) throw added.error

    const retried = await add(await createCart())
    if (retried.error) throw retried.error
    return NextResponse.json({ cart: retried.data })
  } catch (err) {
    return errorResponse(err)
  }
}
