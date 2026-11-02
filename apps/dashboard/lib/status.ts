import {
  SETTLED_PAYMENTS,
  type Order,
  type OrderFulfillmentStatus,
  type OrderStatus,
  type PaymentStatus,
  type Product,
} from "@prood/types"
import type { StatusLook } from "@prood/ui/lib/status"
import { humanize } from "@/lib/format"
import { canFulfillOrder } from "@/lib/order-actions"

export { apiKeyStatus, planStatus } from "@prood/ui/lib/status"
export type { StatusLook }

/**
 * Every status the dashboard shows, in one place. Tones follow a merchant's
 * attention: `success` is settled, `warning` wants something done soon, `info`
 * is moving along, `danger` went wrong, and `neutral` needs nothing. A canceled
 * order is `neutral` because it's over, not because it failed. Telha (`brand`)
 * isn't a status color: it's kept for navigation and the one main action.
 */

/**
 * Tabs and counts filter on these, one status at a time, and each covers several
 * of the states `orderState` gives a row: a `placed` order can be awaiting payment
 * or ready to fulfill. So these name the stage, in words that hold for all of them.
 */
const ORDER: Record<OrderStatus, StatusLook> = {
  placed: { label: "New", tone: "neutral" },
  approved: { label: "In progress", tone: "info" },
  fulfilled: { label: "Fulfilled", tone: "success" },
  cancelled: { label: "Canceled", tone: "neutral" },
}

const PAYMENT: Record<PaymentStatus, StatusLook> = {
  unpaid: { label: "Unpaid", tone: "warning" },
  authorized: { label: "Authorized", tone: "info" },
  paid: { label: "Paid", tone: "success" },
  partially_refunded: { label: "Partially refunded", tone: "neutral" },
  refunded: { label: "Refunded", tone: "neutral" },
  voided: { label: "Failed", tone: "danger" },
  free: { label: "Free", tone: "success" },
}

const FULFILLMENT: Record<OrderFulfillmentStatus, StatusLook> = {
  unfulfilled: { label: "Unfulfilled", tone: "neutral" },
  in_progress: { label: "In progress", tone: "info" },
  fulfilled: { label: "Fulfilled", tone: "success" },
  not_required: { label: "Not required", tone: "neutral" },
}

const PRODUCT: Record<string, StatusLook> = {
  active: { label: "Active", tone: "success" },
  draft: { label: "Draft", tone: "neutral" },
  archived: { label: "Archived", tone: "neutral" },
}

const APPROVAL: Record<string, StatusLook> = {
  pending: { label: "Waiting for you", tone: "warning", needsAction: true },
  approved: { label: "Approved", tone: "success" },
  denied: { label: "Denied", tone: "neutral" },
  expired: { label: "Expired", tone: "neutral" },
}

/** The API types these as plain strings, so a value this file hasn't met still reads properly. */
function lookup(looks: Record<string, StatusLook>, value: string): StatusLook {
  return looks[value] ?? { label: humanize(value), tone: "neutral" }
}

export const orderStatus = (value: string) => lookup(ORDER, value)
export const paymentStatus = (value: string) => lookup(PAYMENT, value)
export const fulfillmentStatus = (value: string) => lookup(FULFILLMENT, value)
export const productStatus = (value: string) => lookup(PRODUCT, value)
export const approvalStatus = (value: string) => lookup(APPROVAL, value)

/**
 * One word for where an order stands, from its order, payment and fulfillment
 * statuses together, so a list needs one column and not three. `needsAction`
 * marks the orders waiting on the merchant to ship them.
 */
export function orderState(
  order: Pick<Order, "status" | "paymentStatus" | "fulfillmentStatus">
): StatusLook {
  if (order.status === "cancelled" || order.paymentStatus === "refunded") {
    return { label: order.paymentStatus === "refunded" ? "Refunded" : "Canceled", tone: "neutral" }
  }
  if (order.status === "fulfilled") return { label: "Fulfilled", tone: "success" }
  if (order.paymentStatus === "voided") return { label: "Payment failed", tone: "danger" }
  if (order.fulfillmentStatus === "in_progress") return { label: "In progress", tone: "info" }
  if (canFulfillOrder(order)) return { label: "To fulfill", tone: "warning", needsAction: true }
  if (SETTLED_PAYMENTS.includes(order.paymentStatus)) return { label: "Complete", tone: "success" }
  if (order.paymentStatus === "authorized") return { label: "Confirming payment", tone: "info" }
  return { label: "Awaiting payment", tone: "neutral" }
}

/** Under `orderState`: the payment, only where it went wrong in a way that state doesn't say. */
export function paymentException(order: Pick<Order, "status" | "paymentStatus" | "fulfillmentStatus">): string | null {
  if (order.paymentStatus === "partially_refunded") return paymentStatus("partially_refunded").label
  if (order.paymentStatus === "voided" && orderState(order).label !== "Payment failed") return "Payment failed"
  return null
}

/** What a merchant needs to know about a product in one word. Plain "Active" is the quiet case. */
export function productState(product: Pick<Product, "status" | "price" | "inStock">): StatusLook {
  const status = product.status ?? "draft"
  if (status !== "active") return lookup(PRODUCT, status)
  if (!product.price) return { label: "No price", tone: "warning" }
  if (!product.inStock) return { label: "Out of stock", tone: "warning" }
  return lookup(PRODUCT, "active")
}

/**
 * A domain, for its owner. Where domains can't connect, verified or not makes no
 * difference to a shopper, so there's one quiet state and nothing to act on.
 */
export function domainStatus(verified: boolean, canConnect: boolean): StatusLook {
  if (!canConnect) return { label: "Saved, not connected", tone: "neutral" }
  return verified ? { label: "Verified", tone: "success" } : { label: "Pending", tone: "warning", needsAction: true }
}

export function integrationStatus(state: { enabled: boolean } | undefined | null): StatusLook {
  if (!state) return { label: "Not connected", tone: "neutral" }
  return state.enabled ? { label: "Connected", tone: "success" } : { label: "Turned off", tone: "warning" }
}

/** Order history stores order and payment statuses alike, so they read as events here. */
const HISTORY: Record<string, string> = {
  placed: "Order placed",
  approved: "Order approved",
  paid: "Payment received",
  fulfilled: "Order fulfilled",
  cancelled: "Order canceled",
  refunded: "Order refunded",
  partially_refunded: "Partly refunded",
}

export function historyLabel(action: string): string {
  return HISTORY[action] ?? humanize(action)
}
