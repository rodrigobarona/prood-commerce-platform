import { NextResponse } from "next/server"
import { verifyPaymentWebhook } from "@workspace/commerce"
import { reconcilePayment } from "@/lib/payments"

// Ifthenpay confirms payments by calling this URL with the anti-phishing key
// in the query string (GET).
export async function GET(request: Request) {
  const query = new URL(request.url).search.replace(/^\?/, "")
  try {
    const event = await verifyPaymentWebhook(query, "", "ifthenpay")
    await reconcilePayment(event)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[webhooks/ifthenpay]", err)
    return new NextResponse("error", { status: 400 })
  }
}

export async function POST(request: Request) {
  const payload = await request.text()
  try {
    const event = await verifyPaymentWebhook(payload, "", "ifthenpay")
    await reconcilePayment(event)
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[webhooks/ifthenpay]", err)
    return new NextResponse("error", { status: 400 })
  }
}
