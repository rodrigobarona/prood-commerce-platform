import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { catalog } from "@/lib/commerce-service"
import { errorResponse } from "@/lib/api"

export async function GET() {
  try {
    const { orgId } = await requireCaller("storefront")
    return NextResponse.json(await catalog.getStore(orgId))
  } catch (err) {
    return errorResponse(err)
  }
}
