/** Every store's shipping for now, in major units of its currency. Setting your own is coming later. */
export const FIXED_SHIPPING_RATES = {
  standard: { amount: 15, days: { min: 5, max: 7 } },
  express: { amount: 35, days: { min: 1, max: 2 } },
} as const
