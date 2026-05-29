import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { carts } from "@/lib/commerce-service"
import { updateCartItemBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const { orgId } = await requireCaller("storefront")
    const { quantity } = await readBody(req, updateCartItemBody)
    return NextResponse.json(await carts.updateItem(orgId, id, itemId, quantity))
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const { orgId } = await requireCaller("storefront")
    return NextResponse.json(await carts.removeItem(orgId, id, itemId))
  } catch (err) {
    return errorResponse(err)
  }
}
