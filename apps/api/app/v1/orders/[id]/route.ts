import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { orders } from "@/lib/commerce-service"
import { errorResponse } from "@/lib/api"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("storefront")
    return NextResponse.json(await orders.get(orgId, id))
  } catch (err) {
    return errorResponse(err)
  }
}
