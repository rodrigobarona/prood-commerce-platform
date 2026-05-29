import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { carts } from "@/lib/commerce-service"
import { addToCartBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("storefront")
    const item = await readBody(req, addToCartBody)
    return NextResponse.json(await carts.addItem(orgId, id, item), { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
