import { NextResponse } from "next/server"
import { z } from "zod"
import { loadAndHydrate, persistSession } from "@workspace/checkout-host"
import { errorResponse } from "@/lib/api"

const paySchema = z.object({
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  sourceToken: z.string().optional(),
  idempotencyKey: z.string().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

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
    const body = paySchema.parse(await request.json())

    if (session.state === "idle") {
      session.setCustomerInfo({
        email: body.email,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
      })
    }

    const paymentSession = await session.submitPayment({
      sourceToken: body.sourceToken,
      idempotencyKey: body.idempotencyKey,
      metadata: body.metadata,
    })

    const snapshot = await persistSession(id, session, meta)

    return NextResponse.json({
      sessionId: id,
      providerId: meta.providerId,
      publishableKey: meta.publishableKey,
      redirectUrl: paymentSession.redirectUrl ?? null,
      clientSecret: (paymentSession.providerData?.clientSecret as string | undefined) ?? null,
      ...snapshot,
    })
  } catch (err) {
    return errorResponse(err)
  }
}
