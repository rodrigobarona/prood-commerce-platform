import { NextResponse } from "next/server"
import { CommerceError, orderOutcome } from "@prood/types"
import { loadSession, loadSessionOrder, loadStoreEmail } from "@prood/checkout-host"
import { errorResponse } from "@/lib/api"
import { orderSummary, sessionView } from "@/lib/session-view"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const stored = await loadSession(id)
    if (!stored) throw new CommerceError("Session not found", "NOT_FOUND")

    const [order, storeEmail] = await Promise.all([
      loadSessionOrder(stored.meta),
      loadStoreEmail(stored.meta.tenantId),
    ])
    const outcome = orderOutcome(order)

    return NextResponse.json(
      {
        sessionId: id,
        providerId: stored.meta.providerId,
        publishableKey: stored.meta.publishableKey,
        kind: stored.meta.kind,
        storeName: stored.meta.storeName ?? null,
        storeEmail,
        returnUrl: stored.meta.returnUrl ?? null,
        methods: stored.meta.methods,
        ...sessionView(stored.snapshot),
        order: orderSummary(order),
        state: outcome.state ?? stored.snapshot.state,
        payable: outcome.payable,
      },
      { headers: { "Cache-Control": "no-store" } },
    )
  } catch (err) {
    return errorResponse(err)
  }
}
