import { NextResponse } from "next/server"
import { loadAndHydrate, persistSession } from "@prood/checkout-host"
import { errorResponse } from "@/lib/api"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const loaded = await loadAndHydrate(id)
    if (!loaded) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    const { session, meta } = loaded
    const body = (await request.json().catch(() => ({}))) as {
      providerSessionId?: string
    }

    const confirmed = await session.confirmPayment(body.providerSessionId)
    const snapshot = await persistSession(id, session, meta)

    return NextResponse.json({
      sessionId: id,
      providerId: meta.providerId,
      state: snapshot.state,
      paymentSession: confirmed,
      orderId: snapshot.orderId,
      returnUrl: meta.returnUrl,
      error: snapshot.error,
    })
  } catch (err) {
    return errorResponse(err)
  }
}
