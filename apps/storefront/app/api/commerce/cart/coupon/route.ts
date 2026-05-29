import { NextResponse } from "next/server"
import { z } from "zod"
import { CommerceError, applyCoupon, removeCoupon } from "@workspace/commerce"
import { errorResponse } from "@/lib/api"
import { getCartId } from "@/lib/cart-cookie"
import { resolveTenantId } from "@/lib/tenant"

const couponSchema = z.object({ code: z.string().min(1) })

export async function POST(request: Request) {
  try {
    const id = await getCartId()
    if (!id) throw new CommerceError("No active cart", "NOT_FOUND", 404)
    const { code } = couponSchema.parse(await request.json())
    const tenantId = await resolveTenantId()
    const cart = await applyCoupon(id, code, tenantId)
    return NextResponse.json({ cart })
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE() {
  try {
    const id = await getCartId()
    if (!id) throw new CommerceError("No active cart", "NOT_FOUND", 404)
    const tenantId = await resolveTenantId()
    const cart = await removeCoupon(id, tenantId)
    return NextResponse.json({ cart })
  } catch (err) {
    return errorResponse(err)
  }
}
