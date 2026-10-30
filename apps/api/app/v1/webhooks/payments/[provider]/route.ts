import { NextResponse } from "next/server"
import { CommerceError } from "@prood/types"
import { webhooks } from "@/lib/commerce-service"
import { requireCheckoutSecret } from "@/lib/require-checkout-secret"
import { errorResponse } from "@/lib/api"

type Ctx = { params: Promise<{ provider: string }> }

function requireOrg(request: Request): string {
  const org = new URL(request.url).searchParams.get("org")
  if (!org) throw new CommerceError("Missing org query parameter", "VALIDATION", 400)
  return org
}

/**
 * Stripe signs its payloads, so Stripe may call this endpoint directly. Other
 * gateways are only accepted when forwarded by apps/checkout with the shared
 * checkout secret (they are re-verified per provider either way).
 */
function requireAuth(request: Request, provider: string): void {
  const hasStripeSignature =
    provider === "stripe" && request.headers.has("stripe-signature")
  if (!hasStripeSignature) {
    requireCheckoutSecret(request)
  }
}

/** POST — Stripe (signed body), Easypay, and other providers with a raw payload. */
export async function POST(request: Request, { params }: Ctx) {
  try {
    const { provider } = await params
    requireAuth(request, provider)
    const signature =
      provider === "stripe" ? (request.headers.get("stripe-signature") ?? "") : ""
    const payload = await request.text()
    const result = await webhooks.reconcilePayment(provider, payload, signature, requireOrg(request))
    return NextResponse.json({ received: true, result })
  } catch (err) {
    return errorResponse(err)
  }
}

/** GET — Ifthenpay delivers callbacks as query-string GETs. */
export async function GET(request: Request, { params }: Ctx) {
  try {
    const { provider } = await params
    requireAuth(request, provider)
    const url = new URL(request.url)
    const org = requireOrg(request)
    url.searchParams.delete("org")
    const query = url.search.replace(/^\?/, "")
    const result = await webhooks.reconcilePayment(provider, query, "", org)
    return NextResponse.json({ received: true, result })
  } catch (err) {
    return errorResponse(err)
  }
}
