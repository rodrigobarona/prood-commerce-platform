import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { fulfillOrderBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("admin")
    const input = await readBody(req, fulfillOrderBody)
    await admin.fulfillOrder(orgId, id, input)
    return NextResponse.json({ success: true })
  } catch (err) {
    return errorResponse(err)
  }
}
