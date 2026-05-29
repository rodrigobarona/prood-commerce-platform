import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { checkout } from "@/lib/commerce-service"
import { setShippingMethodBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("storefront")
    const { methodId } = await readBody(req, setShippingMethodBody)
    return NextResponse.json(
      await checkout.setShippingMethod(orgId, id, methodId)
    )
  } catch (err) {
    return errorResponse(err)
  }
}
