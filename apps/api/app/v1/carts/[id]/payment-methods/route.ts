import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { carts, checkout } from "@/lib/commerce-service"
import { errorResponse } from "@/lib/api"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("storefront")
    // The methods are the store's, not the cart's, but an unknown cart is still a 404.
    await carts.get(orgId, id)
    return NextResponse.json(await checkout.getPaymentMethods(orgId))
  } catch (err) {
    return errorResponse(err)
  }
}
