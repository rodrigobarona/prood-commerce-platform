import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { catalog } from "@/lib/commerce-service"
import { categoriesQuery } from "@/lib/schemas"
import { readQuery } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function GET(req: Request) {
  try {
    const { orgId } = await requireCaller("storefront")
    const query = readQuery(req, categoriesQuery)
    return NextResponse.json(await catalog.listCategories(orgId, query))
  } catch (err) {
    return errorResponse(err)
  }
}
