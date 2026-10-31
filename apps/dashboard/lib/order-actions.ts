import type { Order } from "@prood/types"

const OPEN = new Set<Order["status"]>(["placed", "approved"])
// Nothing is owed on these, so they can ship. A partial refund leaves the sale standing.
const SETTLED = new Set<Order["paymentStatus"]>(["paid", "free", "partially_refunded"])

export function canFulfillOrder(order: Pick<Order, "status" | "paymentStatus">): boolean {
  return OPEN.has(order.status) && SETTLED.has(order.paymentStatus)
}
