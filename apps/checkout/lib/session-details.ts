/** What the session API says about an order, for the pages that show it. */
export interface OrderSummary {
  number: string
  /** Where the confirmation goes, when that's known. */
  contactEmail: string | null
  /** Whether the shopper will get a confirmation at all. */
  emailed: boolean
  items: { id: string; name: string; variantName: string | null; quantity: number; amount: number }[]
  /** On top of the items. Null when there's none. */
  shipping: number | null
}

/** The session fields a finished payment shows. */
export interface SessionDetails {
  storeName?: string | null
  /** The store's public address, when it has listed one. */
  storeEmail?: string | null
  returnUrl?: string | null
  orderId?: string | null
  amount: number
  currency: string
  order?: OrderSummary | null
}
