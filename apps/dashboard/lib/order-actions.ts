import { SETTLED_PAYMENTS, type Order } from "@prood/types"

const OPEN = new Set<Order["status"]>(["placed", "approved"])

export function canFulfillOrder(order: Pick<Order, "status" | "paymentStatus" | "fulfillmentStatus">): boolean {
  return OPEN.has(order.status) && SETTLED_PAYMENTS.includes(order.paymentStatus) && order.fulfillmentStatus !== "not_required"
}
