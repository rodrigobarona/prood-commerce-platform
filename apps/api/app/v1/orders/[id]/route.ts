import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { orders } from "@/lib/commerce-service"
import { getOrderQuery } from "@/lib/schemas"
import { readQuery } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const caller = await requireCaller("storefront")
    const { email } = readQuery(req, getOrderQuery)
    return NextResponse.json(await orders.getForCaller(caller, id, email))
  } catch (err) {
    return errorResponse(err)
  }
}
