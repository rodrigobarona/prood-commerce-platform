import { NextResponse } from "next/server"
import { forwardPaymentWebhook } from "@prood/checkout-host/reconcile"

type Ctx = { params: Promise<{ provider: string; org: string }> }

export async function POST(request: Request, { params }: Ctx) {
  const { provider, org } = await params
  const signature =
    provider === "stripe" ? (request.headers.get("stripe-signature") ?? "") : ""
  const payload = await request.text()

  try {
    await forwardPaymentWebhook(provider, payload, signature, decodeURIComponent(org))
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error(`[webhooks/${provider}]`, err)
    return new NextResponse("Invalid webhook", { status: 400 })
  }
}

export async function GET(request: Request, { params }: Ctx) {
  const { provider, org } = await params
  const query = new URL(request.url).search.replace(/^\?/, "")

  try {
    await forwardPaymentWebhook(provider, query, "", decodeURIComponent(org), "GET")
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error(`[webhooks/${provider}]`, err)
    return new NextResponse("error", { status: 400 })
  }
}
