import { NextResponse } from "next/server"
import { CommerceError, orderOutcome } from "@prood/types"
import { loadSession, loadSessionOrder } from "@prood/checkout-host"
import { errorResponse } from "@/lib/api"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const stored = await loadSession(id)
    if (!stored) throw new CommerceError("Session not found", "NOT_FOUND")

    const outcome = orderOutcome(await loadSessionOrder(stored.meta))

    return NextResponse.json({
      sessionId: id,
      providerId: stored.meta.providerId,
      publishableKey: stored.meta.publishableKey,
      kind: stored.meta.kind,
      storeName: stored.meta.storeName ?? null,
      returnUrl: stored.meta.returnUrl ?? null,
      methods: stored.meta.methods,
      ...stored.snapshot,
      state: outcome.state ?? stored.snapshot.state,
      payable: outcome.payable,
    })
  } catch (err) {
    return errorResponse(err)
  }
}
