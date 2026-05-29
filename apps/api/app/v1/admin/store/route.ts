import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { updateStoreBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function GET() {
  try {
    const { orgId } = await requireCaller("admin")
    return NextResponse.json(await admin.getStoreSettings(orgId))
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PATCH(req: Request) {
  try {
    const { orgId } = await requireCaller("admin")
    const input = await readBody(req, updateStoreBody)
    return NextResponse.json(await admin.updateStoreSettings(orgId, input))
  } catch (err) {
    return errorResponse(err)
  }
}
