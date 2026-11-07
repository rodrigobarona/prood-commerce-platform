import { NextResponse } from "next/server"
import { z } from "zod"
import { eraseCustomer } from "@prood/commerce/store-data"
import { errorResponse } from "@/lib/api"
import { requireCaller } from "@/lib/auth-tenant"
import { readBody } from "@/lib/validate"

const body = z.object({ scrubOrders: z.boolean() })

/**
 * Erases one shopper from the active store (GDPR Art. 17, for the store as controller).
 * Owners and admins, from a signed-in session. It is not part of /v1, so an API key or an
 * AI agent can't erase people.
 */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const caller = await requireCaller("admin")
    if (caller.via !== "session") {
      return NextResponse.json({ error: "Erase a customer from your dashboard." }, { status: 403 })
    }
    const { id } = await params
    const { scrubOrders } = await readBody(req, body)
    const result = await eraseCustomer(caller.orgId, id, { scrubOrders })
    if (!result.customer) return NextResponse.json({ error: "That customer doesn't exist." }, { status: 404 })
    return NextResponse.json(result)
  } catch (err) {
    return errorResponse(err)
  }
}
