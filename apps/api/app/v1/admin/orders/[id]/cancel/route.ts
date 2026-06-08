import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { cancelOrderBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("admin")
    const body = await readBody(req, cancelOrderBody)
    await admin.cancelOrder(orgId, id, body.note)
    return NextResponse.json({ success: true })
  } catch (err) {
    return errorResponse(err)
  }
}
