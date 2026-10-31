/** Where to send a shopper back to, carrying their order when there is one. */
export function storeUrl(session: {
  returnUrl?: string | null
  orderId?: string | null
}): string | null {
  if (!session.returnUrl) return null
  const url = new URL(session.returnUrl)
  if (session.orderId) url.searchParams.set("orderId", session.orderId)
  return url.toString()
}
