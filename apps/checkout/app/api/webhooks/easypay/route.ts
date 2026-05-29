import { NextResponse } from "next/server"
import { verifyPaymentWebhook } from "@workspace/commerce"
import { reconcilePayment } from "@workspace/checkout-host"

export async function POST(request: Request) {
  const payload = await request.text()
  try {
    const event = await verifyPaymentWebhook(payload, "", "easypay")
    await reconcilePayment(event)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[webhooks/easypay]", err)
    return new NextResponse("error", { status: 400 })
  }
}
