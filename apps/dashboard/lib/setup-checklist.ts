export interface SetupItem {
  id: "product" | "payment" | "contact-email" | "test-order"
  title: string
  description: string
  done: boolean
  action: string
  href: string
  /** Opens outside the dashboard, on the store itself. */
  external?: boolean
  /** Waiting on an earlier step, so its action isn't offered yet. */
  blocked?: boolean
}

export interface SetupProgress {
  totalProducts: number
  activeProducts: number
  paidOrders: number
  canTakeOrders: boolean
  hasContactEmail: boolean
}

/** What's left before a store can sell. Only published products count: customers can't buy a draft. */
export function setupChecklist(progress: SetupProgress, storeUrl: string | null): SetupItem[] {
  const hasDraft = progress.totalProducts > 0
  const canBuy = progress.activeProducts > 0 && progress.canTakeOrders
  return [
    {
      id: "product",
      title: "Add a product",
      description: hasDraft
        ? "Your products are still drafts. Publish one so customers can buy it."
        : "Customers need something to buy.",
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
      id: "contact-email",
      title: "Add a contact email",
      description: "Customers need a way to reach you when an order goes wrong.",
      done: progress.hasContactEmail,
      action: "Add a contact email",
      href: "/settings",
    },
    {
      id: "test-order",
      title: "Place a test order",
      description: canBuy
        ? "Buy from your own store and pay, to check that checkout works."
        : "Publish a product and connect a payment provider first.",
      done: progress.paidOrders > 0,
      action: "Open your store",
      href: storeUrl ?? "",
      external: true,
      blocked: !canBuy || !storeUrl,
    },
  ]
}
