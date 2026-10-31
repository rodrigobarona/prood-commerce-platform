import type { StoredSession } from "@prood/checkout-host"

// What the payment page reads from a started payment. The rest of `providerData`
// is the provider's raw response, which isn't the shopper's to see.
const PAYMENT_DATA = ["clientSecret", "reference", "entity", "expiresAt"]

/** A session as its payment page needs it. Anyone with the link can read this. */
export function sessionView(snapshot: StoredSession["snapshot"]) {
  const { state, expiresAt, customerInfo, amount, currency, orderId, paymentSession } = snapshot
  return {
    state,
    expiresAt,
    customerInfo,
    amount,
    currency,
    orderId,
    paymentSession: paymentSession && {
      id: paymentSession.id,
      status: paymentSession.status,
      method: paymentSession.method,
      redirectUrl: paymentSession.redirectUrl,
      createdAt: paymentSession.createdAt,
      providerData: Object.fromEntries(
        Object.entries(paymentSession.providerData ?? {}).filter(([key]) => PAYMENT_DATA.includes(key)),
      ),
    },
  }
}
