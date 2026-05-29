import { NextResponse } from "next/server"
import { createCart, getCart } from "@workspace/commerce"
import { errorResponse } from "@/lib/api"
import { getCartId, setCartId } from "@/lib/cart-cookie"
import { resolveTenantId } from "@/lib/tenant"

export async function GET() {
  try {
    const id = await getCartId()
    if (!id) return NextResponse.json({ cart: null })
    try {
      const tenantId = await resolveTenantId()
      const cart = await getCart(id, tenantId)
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
    const tenantId = await resolveTenantId()
    const cart = await createCart(tenantId)
    await setCartId(cart.id)
    return NextResponse.json({ cart })
  } catch (err) {
    return errorResponse(err)
  }
}
