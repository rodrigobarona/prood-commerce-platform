import { isCommerceApiError } from "@prood/api-client"

/**
 * What to tell a shopper when checkout can't start. The API's message is theirs
 * to read unless it's meant for the merchant, and a thrown error never is.
 */
export function checkoutErrorMessage(err: unknown): string {
  // API errors arrive as plain bodies. Anything with a stack came from our own
  // code or a driver, even if it has a `code` and looks like one.
  if (err instanceof Error || !isCommerceApiError(err)) {
    return "We couldn't start checkout. Try again in a moment."
  }
  if (err.code === "ORDERS_UNAVAILABLE") {
    return "This store isn't taking orders right now. Your cart is saved, so try again later."
  }
  return err.message
}
