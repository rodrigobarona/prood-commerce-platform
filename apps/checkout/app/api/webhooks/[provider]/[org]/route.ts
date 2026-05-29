import { NextResponse } from "next/server"
import { verifyPaymentWebhook } from "@workspace/commerce"
import { reconcilePayment } from "@workspace/checkout-host"

type Ctx = { params: Promise<{ provider: string; org: string }> }

// "_" is the sentinel for "no tenant" (env-based credentials).
function tenantFrom(org: string): string | undefined {
  return org && org !== "_" ? decodeURIComponent(org) : undefined
}

// POST — Stripe (signed header), EasyPay, and IfThenPay notifications.
export async function POST(request: Request, { params }: Ctx) {
  const { provider, org } = await params
  const signature =
    provider === "stripe" ? (request.headers.get("stripe-signature") ?? "") : ""
  const payload = await request.text()

  try {
    const event = await verifyPaymentWebhook(
      payload,
      signature,
      provider,
      tenantFrom(org),
    )
    await reconcilePayment(event)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error(`[webhooks/${provider}]`, err)
    return new NextResponse("Invalid webhook", { status: 400 })
  }
}

// GET — IfThenPay delivers callbacks as query-string GETs.
export async function GET(request: Request, { params }: Ctx) {
  const { provider, org } = await params
  const query = new URL(request.url).search.replace(/^\?/, "")

  try {
    const event = await verifyPaymentWebhook(query, "", provider, tenantFrom(org))
    await reconcilePayment(event)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error(`[webhooks/${provider}]`, err)
    return new NextResponse("error", { status: 400 })
  }
}
