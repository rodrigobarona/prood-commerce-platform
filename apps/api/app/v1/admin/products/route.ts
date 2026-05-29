import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { adminListQuery, createProductBody } from "@/lib/schemas"
import { readBody, readQuery } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function GET(req: Request) {
  try {
    const { orgId } = await requireCaller("admin")
    const query = readQuery(req, adminListQuery)
    return NextResponse.json(await admin.listProducts(orgId, query))
  } catch (err) {
    return errorResponse(err)
  }
}

export async function POST(req: Request) {
  try {
    const { orgId } = await requireCaller("admin")
    const input = await readBody(req, createProductBody)
    return NextResponse.json(await admin.createProduct(orgId, input), { status: 201 })
  } catch (err) {
    return errorResponse(err)
  }
}
