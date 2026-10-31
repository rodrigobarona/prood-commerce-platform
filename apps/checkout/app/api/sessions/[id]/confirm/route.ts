import { NextResponse } from "next/server"
import { CommerceError, orderOutcome, PAYMENT_DECLINED_PARAM, PAYMENT_DECLINED_VALUE } from "@prood/types"
import {
  loadAndHydrate,
  loadSession,
  loadSessionOrder,
  lockSession,
  persistSession,
  syncSessionWithOrder,
  unlockSession,
} from "@prood/checkout-host"
import { errorResponse } from "@/lib/api"

/** Report where a session stands without saving: someone else holds its lock. */
async function readSession(id: string) {
  const stored = await loadSession(id)
  if (!stored) throw new CommerceError("Session not found", "NOT_FOUND")

  const outcome = orderOutcome(await loadSessionOrder(stored.meta))
  return NextResponse.json({
    sessionId: id,
    providerId: stored.meta.providerId,
    state: outcome.state ?? stored.snapshot.state,
    payable: outcome.payable,
    orderId: stored.snapshot.orderId,
    returnUrl: stored.meta.returnUrl,
  })
}

async function confirmSession(id: string, declined: boolean) {
  // A payment already under way still finishes on a provider that was disabled since.
  const loaded = await loadAndHydrate(id, { includeDisabled: true })
  if (!loaded) throw new CommerceError("Session not found", "NOT_FOUND")

  const { session, meta } = loaded
  const outcome = orderOutcome(await loadSessionOrder(meta))

  // The order already knows how this ended, so don't ask the provider.
  if (session.state === "payment" && !outcome.state) {
    const hosted = session.paymentSession?.method === "card" && session.paymentSession.redirectUrl
    if (declined && hosted) session.abandonPayment()
    else await session.confirmPayment()
  }
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
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const declined =
      new URL(request.url).searchParams.get(PAYMENT_DECLINED_PARAM) === PAYMENT_DECLINED_VALUE

    // Saving a session read before /pay finished would undo the payment it saved.
    const lock = await lockSession(id)
    if (!lock) return await readSession(id)

    try {
      return await confirmSession(id, declined)
    } finally {
      await unlockSession(id, lock).catch((err) =>
        console.error(`[checkout] could not release session ${id}`, err),
      )
    }
  } catch (err) {
    return errorResponse(err)
  }
}
