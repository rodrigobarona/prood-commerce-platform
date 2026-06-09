import { NextResponse } from "next/server"
import { createGuestCustomer, ensureCustomer, getCart } from "@prood/commerce"
import { requireCaller } from "@/lib/auth-tenant"
import { checkout } from "@/lib/commerce-service"
import { assertCanPlaceOrder } from "@/lib/enforcement"
import { errorResponse } from "@/lib/api"
import { placeOrderBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const caller = await requireCaller("storefront")
    await assertCanPlaceOrder(caller.orgId)

    const body = await readBody(req, placeOrderBody)

    let customerId: string
    if (caller.userId) {
      customerId = await ensureCustomer(caller.orgId, caller.userId)
    } else {
      const cart = await getCart(id, caller.orgId)
      const addr = cart.billingAddress ?? cart.shippingAddress
      customerId = await createGuestCustomer(caller.orgId, {
        email: body.email ?? null,
        firstName: addr?.firstName ?? null,
        lastName: addr?.lastName ?? null,
        phone: addr?.phone ?? null,
      })
    }

    const order = await checkout.placeOrder(caller.orgId, id, customerId, body.email)
    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
