export interface SetupItem {
  id: "product" | "payment" | "test-order"
  title: string
  description: string
  done: boolean
  action: string
  href: string
  /** Opens outside the dashboard, on the store itself. */
  external?: boolean
}

export interface SetupProgress {
  totalProducts: number
  activeProducts: number
  totalOrders: number
  canTakeOrders: boolean
}

/** What's left before a store can sell. Only published products count: shoppers can't buy a draft. */
export function setupChecklist(progress: SetupProgress, storeUrl: string): SetupItem[] {
  const hasDraft = progress.totalProducts > 0
  return [
    {
      id: "product",
      title: "Add a product",
      description: hasDraft
        ? "Your products are still drafts. Publish one so shoppers can buy it."
        : "Shoppers need something to buy.",
      done: progress.activeProducts > 0,
      action: hasDraft ? "Publish a product" : "Add product",
      href: hasDraft ? "/products" : "/products/new",
    },
    {
      id: "payment",
      title: "Connect a payment provider",
      description: "Your store can't take orders until one is connected. Payouts go straight to your account.",
      done: progress.canTakeOrders,
      action: "Connect a provider",
      href: "/integrations",
    },
    {
      id: "test-order",
      title: "Place a test order",
      description: "Buy from your own store to check that checkout works.",
      done: progress.totalOrders > 0,
      action: "Open your store",
      href: storeUrl,
      external: true,
    },
  ]
}
