import { NextResponse } from "next/server"
import { z } from "zod"
import { CommerceError, removeFromCart, revalidateProducts, updateCartItem } from "@workspace/commerce"
import { errorResponse } from "@/lib/api"
import { getCartId } from "@/lib/cart-cookie"

const updateSchema = z.object({ quantity: z.number().int().positive() })

type Ctx = { params: Promise<{ itemId: string }> }

export async function PUT(request: Request, { params }: Ctx) {
  try {
    const id = await getCartId()
    if (!id) throw new CommerceError("No active cart", "NOT_FOUND", 404)
    const { itemId } = await params
    const { quantity } = updateSchema.parse(await request.json())
    const cart = await updateCartItem(id, itemId, quantity)
    revalidateProducts()
    return NextResponse.json({ cart })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(_request: Request, { params }: Ctx) {
  try {
    const id = await getCartId()
    if (!id) throw new CommerceError("No active cart", "NOT_FOUND", 404)
    const { itemId } = await params
    const cart = await removeFromCart(id, itemId)
    revalidateProducts()
    return NextResponse.json({ cart })
  } catch (err) {
    return errorResponse(err)
  }
}
