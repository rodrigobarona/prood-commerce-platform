import type { Order } from "@prood/types"

/** The value of `placed` on the link checkout sends a shopper back with. */
export const JUST_PLACED = "1"

/** An order's page. It reads the signed-in shopper's session, so no email goes in the link. */
export function orderHref(order: Pick<Order, "id">): string {
  return `/order-confirmation?orderId=${encodeURIComponent(order.id)}`
}
