import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { updateCategoryBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("admin")
    const input = await readBody(req, updateCategoryBody)
    return NextResponse.json(await admin.updateCategory(orgId, id, input))
  } catch (err) {
    return errorResponse(err)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("admin")
    await admin.deleteCategory(orgId, id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return errorResponse(err)
  }
}
