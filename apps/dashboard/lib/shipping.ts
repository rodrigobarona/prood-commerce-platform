import { FIXED_SHIPPING_RATES } from "@prood/types"
import { formatPrice } from "@prood/ui/lib/commerce"

function rate(label: string, { amount, days }: (typeof FIXED_SHIPPING_RATES)["standard" | "express"], currency: string) {
  return `${label} ${formatPrice({ amount, currency, formatted: "" })} (${days.min} to ${days.max} days)`
}

/** What shoppers pay to ship. Merchants can't change it yet, so it's stated, not offered as a setting. */
export function shippingNote(currency: string): string {
  const standard = rate("Standard", FIXED_SHIPPING_RATES.standard, currency)
  const express = rate("Express", FIXED_SHIPPING_RATES.express, currency)
  return `Shipping is fixed for now: ${standard}, ${express}. Setting your own rates is coming later.`
}
