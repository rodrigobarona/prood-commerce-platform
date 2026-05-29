import { NextResponse } from "next/server"
import { verifyPaymentWebhook } from "@workspace/commerce"
import { reconcilePayment } from "@/lib/payments"

// Stripe requires the raw request body for signature verification.
export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature") ?? ""
  const payload = await request.text()

  try {
    const event = await verifyPaymentWebhook(payload, signature, "stripe")
    await reconcilePayment(event)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[webhooks/stripe]", err)
    return new NextResponse("Invalid signature", { status: 400 })
  }
}
