import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { errorResponse } from "@/lib/api"

// Echoes the resolved caller — useful for verifying API keys, sessions, and
// host-based tenant resolution end to end.
export async function GET() {
  try {
    const caller = await requireCaller("storefront")
    return NextResponse.json({
      organizationId: caller.orgId,
      scopes: caller.scopes,
      via: caller.via,
    })
  } catch (err) {
    return errorResponse(err)
  }
}
