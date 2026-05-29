import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { createCategoryBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function POST(req: Request) {
  try {
    const { orgId } = await requireCaller("admin")
    const input = await readBody(req, createCategoryBody)
    return NextResponse.json(await admin.createCategory(orgId, input), { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
