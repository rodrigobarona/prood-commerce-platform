import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { checkout } from "@/lib/commerce-service"
import { errorResponse } from "@/lib/api"

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("storefront")
    const order = await checkout.placeOrder(orgId, id)
    return NextResponse.json(order, { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
