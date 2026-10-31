import { NextResponse } from "next/server"
import { z } from "zod"
import {
  CommerceError,
  MBWAY_WINDOW_MS,
  orderOutcome,
  toPortugueseMobile,
  type PaymentSession,
} from "@prood/types"
import {
  loadAndHydrate,
  loadSessionOrder,
  persistSession,
  recordStartedPayment,
} from "@prood/checkout-host"
import { errorResponse } from "@/lib/api"

const paySchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  method: z.enum(["card", "multibanco", "mbway"]).optional(),
  sourceToken: z.string().optional(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

/** An unanswered MB WAY request is dead after its window; anything else can still be paid. */
function isDeadPayment(payment: PaymentSession | null): boolean {
  return (
    payment?.method === "mbway" &&
    Date.now() - new Date(payment.createdAt).getTime() > MBWAY_WINDOW_MS
  )
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const loaded = await loadAndHydrate(id)
    if (!loaded) throw new CommerceError("Session not found", "NOT_FOUND")

    const { session, meta } = loaded
    const body = paySchema.parse(await request.json())

    if (session.state === "payment" && isDeadPayment(session.paymentSession)) {
      session.abandonPayment()
    }

    // A reload or second click must never create a second payable reference.
    if (session.state !== "payment" && session.state !== "complete") {
      const method = body.method ?? meta.methods[0]
      if (!method || !meta.methods.includes(method)) {
        throw new CommerceError("This store doesn't offer that payment method.", "VALIDATION", 422)
      }

      const phone = method === "mbway" ? (toPortugueseMobile(body.phone) ?? undefined) : body.phone
      if (method === "mbway" && !phone) {
        throw new CommerceError("MB WAY needs a Portuguese mobile number.", "VALIDATION", 422)
      }

      if (!orderOutcome(await loadSessionOrder(meta)).payable) {
        throw new CommerceError("This order is no longer waiting for payment.", "VALIDATION", 409)
      }

      if (session.state === "idle") {
        session.setCustomerInfo({
          email: body.email,
          firstName: body.firstName,
          lastName: body.lastName,
          phone,
        })
      } else if (phone) {
        session.updateCustomerInfo({ phone })
      }

      const payment = await session.submitPayment({
        method,
        sourceToken: body.sourceToken,
        idempotencyKey: body.idempotencyKey,
        customerId: meta.customerId ?? undefined,
        metadata: body.metadata,
      })

      // Saved first: the shopper's reference must survive a failed order write.
      await persistSession(id, session, meta)
      await recordStartedPayment(meta, payment, method).catch((err) =>
        console.error(`[checkout] could not record the payment on order ${meta.orderId}`, err),
      )
    }

    const snapshot = session.toSnapshot()

    return NextResponse.json({
      sessionId: id,
      providerId: meta.providerId,
      publishableKey: meta.publishableKey,
      redirectUrl: snapshot.paymentSession?.redirectUrl ?? null,
      ...snapshot,
    })
  } catch (err) {
    return errorResponse(err)
  }
}
