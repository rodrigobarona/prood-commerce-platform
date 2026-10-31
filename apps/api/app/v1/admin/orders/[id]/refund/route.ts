import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { refundOrderBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("admin")
    await admin.refundOrder(orgId, id, await readBody(req, refundOrderBody))
    return NextResponse.json({ success: true })
  } catch (err) {
    return errorResponse(err)
  }
}
