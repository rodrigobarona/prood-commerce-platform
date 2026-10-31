import type { Cart, Price } from "@prood/types"

/** Why shoppers can't buy from a store with no payment provider connected. */
export const STORE_CLOSED_MESSAGE = "This store isn't taking orders yet."

/** Nothing to pay means no provider needed, the same rule as the API's `assertPayable`. */
export function isFree(price: Pick<Price, "amount"> | null | undefined): boolean {
  return price != null && price.amount <= 0
}

export function canCheckOut(canTakeOrders: boolean, cart: Pick<Cart, "totals"> | null): boolean {
  return canTakeOrders || isFree(cart?.totals.total)
}
