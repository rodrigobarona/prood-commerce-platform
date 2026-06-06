import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { errorResponse } from "@/lib/api"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("admin")
    const body = (await req.json().catch(() => ({}))) as { note?: string }
    await admin.cancelOrder(orgId, id, body.note)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return errorResponse(err)
  }
}
