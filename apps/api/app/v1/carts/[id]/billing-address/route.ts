import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { checkout } from "@/lib/commerce-service"
import { checkoutAddressBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("storefront")
    const address = await readBody(req, checkoutAddressBody)
    return NextResponse.json(await checkout.setBillingAddress(orgId, id, address))
  } catch (err) {
    return errorResponse(err)
  }
}
