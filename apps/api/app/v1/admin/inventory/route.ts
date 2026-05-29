import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { updateInventoryBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function POST(req: Request) {
  try {
    const { orgId } = await requireCaller("admin")
    const input = await readBody(req, updateInventoryBody)
    await admin.updateInventory(orgId, input)
    return NextResponse.json({ success: true })
  } catch (err) {
    return errorResponse(err)
  }
}
