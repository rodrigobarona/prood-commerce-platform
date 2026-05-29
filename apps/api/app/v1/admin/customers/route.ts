import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { adminListQuery } from "@/lib/schemas"
import { readQuery } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function GET(req: Request) {
  try {
    const { orgId } = await requireCaller("admin")
    const query = readQuery(req, adminListQuery)
    return NextResponse.json(await admin.listCustomers(orgId, query))
  } catch (err) {
    return errorResponse(err)
  }
}
