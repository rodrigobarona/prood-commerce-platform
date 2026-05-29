import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { carts } from "@/lib/commerce-service"
import { errorResponse } from "@/lib/api"

export async function POST() {
  try {
    const { orgId } = await requireCaller("storefront")
    return NextResponse.json(await carts.create(orgId), { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
