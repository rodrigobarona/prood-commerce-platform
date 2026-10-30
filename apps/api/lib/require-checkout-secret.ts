import "server-only"
import { CommerceError, safeEqual } from "@prood/types"

/** Authenticate server-to-server calls from apps/checkout (payment webhooks). */
export function requireCheckoutSecret(req: Request): void {
  const expected = process.env.CHECKOUT_API_SECRET?.trim()
  const provided = req.headers.get("x-checkout-secret")?.trim()
  if (!expected || !provided || !safeEqual(provided, expected)) {
    throw new CommerceError("Invalid checkout secret", "UNAUTHORIZED", 401)
  }
}
