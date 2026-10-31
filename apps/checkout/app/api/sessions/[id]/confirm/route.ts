import { NextResponse } from "next/server"
import { CommerceError, orderOutcome } from "@prood/types"
import {
  loadAndHydrate,
  loadSessionOrder,
  persistSession,
  syncSessionWithOrder,
} from "@prood/checkout-host"
import { errorResponse } from "@/lib/api"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const loaded = await loadAndHydrate(id)
    if (!loaded) throw new CommerceError("Session not found", "NOT_FOUND")

    const { session, meta } = loaded
    const outcome = orderOutcome(await loadSessionOrder(meta))

    // The order already knows how this ended, so don't ask the provider.
    if (session.state === "payment" && !outcome.state) await session.confirmPayment()
    syncSessionWithOrder(session, outcome)

    const snapshot = await persistSession(id, session, meta)

    return NextResponse.json({
      sessionId: id,
      providerId: meta.providerId,
      state: outcome.state === "pending" ? "pending" : snapshot.state,
      payable: outcome.payable,
      orderId: snapshot.orderId,
      returnUrl: meta.returnUrl,
    })
  } catch (err) {
    return errorResponse(err)
  }
}
