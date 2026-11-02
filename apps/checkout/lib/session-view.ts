import type { StoredSession } from "@prood/checkout-host"
import type { Order } from "@prood/types"
import { localized } from "@prood/ui/lib/commerce"
import type { OrderSummary } from "./session-details"

// What the payment page reads from a started payment. The rest of `providerData`
// is the provider's raw response, which isn't the shopper's to see.
const PAYMENT_DATA = ["clientSecret", "reference", "entity", "expiresAt"]

/** An order as the payment pages show it, under the same link as the session. */
export function orderSummary(order: Order | null): OrderSummary | null {
  if (!order) return null
  return {
    number: order.orderNumber,
    // An account is emailed at its own address, which needn't be this one.
    contactEmail: order.customerId ? null : order.contactEmail,
    emailed: Boolean(order.customerId ?? order.contactEmail),
    items: order.items.map((item) => ({
      id: item.id,
      name: localized(item.name),
      variantName: item.variantName ? localized(item.variantName) : null,
      quantity: item.quantity,
      amount: item.totalPrice.amount,
    })),
    shipping: order.totals.shipping?.amount ?? null,
  }
}

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
