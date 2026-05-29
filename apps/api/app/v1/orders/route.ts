import { NextResponse } from "next/server"
import { requireCaller } from "@/lib/auth-tenant"
import { orders } from "@/lib/commerce-service"
import { listCustomerOrdersQuery } from "@/lib/schemas"
import { readQuery } from "@/lib/validate"
import { errorResponse } from "@/lib/api"

/** List orders for the current storefront tenant (customer filter TBD in adapter). */
export async function GET(req: Request) {
  try {
    const { orgId } = await requireCaller("storefront")
    const query = readQuery(req, listCustomerOrdersQuery)
    return NextResponse.json(
      await orders.list(orgId, {
        page: query.page,
        perPage: query.perPage,
      })
    )
  } catch (err) {
    return errorResponse(err)
  }
}
