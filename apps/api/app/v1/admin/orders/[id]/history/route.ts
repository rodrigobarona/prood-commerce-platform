import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { errorResponse } from "@/lib/api"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("admin")
    const history = await admin.getOrderHistory(orgId, id)
    return NextResponse.json(history)
  } catch (err) {
    return errorResponse(err)
  }
}
