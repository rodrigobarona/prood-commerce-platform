import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { errorResponse } from "@/lib/api"

export async function GET() {
  try {
    const { orgId } = await requireCaller("admin")
    return NextResponse.json(await admin.dashboardStats(orgId))
  } catch (err) {
    return errorResponse(err)
  }
}
