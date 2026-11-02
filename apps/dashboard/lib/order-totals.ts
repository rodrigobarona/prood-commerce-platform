import type { Order } from "@prood/types"

const CENT = 0.005

/**
 * How tax relates to an order's total. Prices usually include VAT, so listing it
 * as a line above the total reads as a sum that doesn't add up. It's only a line
 * of its own when it really was added on top.
 */
export function taxLine(totals: Order["totals"]): { added: boolean } | null {
  if (!totals.tax?.amount) return null
  const withoutTax =
    totals.subtotal.amount + (totals.shipping?.amount ?? 0) - (totals.discount?.amount ?? 0)
  return { added: Math.abs(withoutTax - totals.total.amount) >= CENT }
}
