import { isCommerceApiError } from "@prood/api-client"
import { VALIDATION_FAILED_MESSAGE } from "@prood/types"

const GENERIC = "We couldn't complete that. Try again in a moment."

/**
 * What to tell a shopper when checkout can't start. The API's own message only
 * gets through for domain validation, which is written for them ("Only 2 left
 * in stock"). Everything else is ours to word: a raw message may be an internal
 * one, and a thrown error always is.
 */
export function checkoutErrorMessage(err: unknown): string {
  // API errors arrive as plain bodies. Anything with a stack came from our own
  // code or a driver, even if it has a `code` and looks like one.
  if (err instanceof Error || !isCommerceApiError(err)) return GENERIC

  switch (err.code) {
    case "VALIDATION":
      return err.message === VALIDATION_FAILED_MESSAGE
        ? "Some of your details look wrong. Check them and try again."
        : err.message
    case "ORDERS_UNAVAILABLE":
      return "This store isn't taking orders right now. Your cart is saved, so try again later."
    case "NOT_FOUND":
      return "We couldn't find your cart. Add your items again to check out."
    case "RATE_LIMIT":
      return "That was a lot of attempts. Wait a moment and try again."
    default:
      return GENERIC
  }
}
