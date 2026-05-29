import { NextResponse } from "next/server"
import { createCart, getCart } from "@workspace/commerce"
import { errorResponse } from "@/lib/api"
import { getCartId, setCartId } from "@/lib/cart-cookie"

export async function GET() {
  try {
    const id = await getCartId()
    if (!id) return NextResponse.json({ cart: null })
    try {
      const cart = await getCart(id)
      return NextResponse.json({ cart })
    } catch {
      // Stale / missing cart — treat as empty so the client creates a fresh one.
      return NextResponse.json({ cart: null })
    }
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST() {
  try {
    const cart = await createCart()
    await setCartId(cart.id)
    return NextResponse.json({ cart })
  } catch (err) {
    return errorResponse(err)
  }
}
