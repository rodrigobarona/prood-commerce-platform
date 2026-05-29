import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { carts } from "@/lib/commerce-service"
import { couponBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("storefront")
    const { code } = await readBody(req, couponBody)
    return NextResponse.json(await carts.applyCoupon(orgId, id, code))
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("storefront")
    return NextResponse.json(await carts.removeCoupon(orgId, id))
  } catch (err) {
    return errorResponse(err)
  }
}
