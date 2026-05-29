import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { admin } from "@/lib/commerce-service"
import { updateProductBody } from "@/lib/schemas"
import { readBody } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("admin")
    return NextResponse.json(await admin.getProduct(orgId, id))
  } catch (err) {
    return errorResponse(err)
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { orgId } = await requireCaller("admin")
    const input = await readBody(req, updateProductBody)
    return NextResponse.json(await admin.updateProduct(orgId, id, input))
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
    await admin.deleteProduct(orgId, id)
    return new NextResponse(null, { status: 204 })
  } catch (err) {
    return errorResponse(err)
  }
}
