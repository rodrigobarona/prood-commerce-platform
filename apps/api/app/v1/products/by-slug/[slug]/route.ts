import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { catalog } from "@/lib/commerce-service"
import { errorResponse } from "@/lib/api"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params
    const { orgId } = await requireCaller("storefront")
    return NextResponse.json(await catalog.getProductBySlug(orgId, slug))
  } catch (err) {
    return errorResponse(err)
  }
}
