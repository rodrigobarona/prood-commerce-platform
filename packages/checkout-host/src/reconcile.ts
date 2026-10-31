import 'server-only'

type WebhookMethod = 'GET' | 'POST'

/**
 * Forward a payment provider webhook to the Commerce API, which verifies it
 * against the store's own credentials and reconciles the order.
 */
export async function forwardPaymentWebhook(
  provider: string,
  payload: string,
  signature: string,
  orgId: string,
  method: WebhookMethod = 'POST',
): Promise<void> {
  const base = process.env.COMMERCE_API_URL?.replace(/\/$/, '')
  if (!base) throw new Error('COMMERCE_API_URL is required to forward payment webhooks')
  const secret = process.env.CHECKOUT_API_SECRET?.trim()
  if (!secret) throw new Error('CHECKOUT_API_SECRET is required to forward payment webhooks')

  const params = new URLSearchParams(method === 'GET' ? payload : '')
  // Last, so a query string can't name another store: only the path says whose this is.
  params.set('org', orgId)

  const url = `${base}/webhooks/payments/${encodeURIComponent(provider)}?${params.toString()}`

  const res = await fetch(url, {
    method,
    headers: {
      'x-checkout-secret': secret,
      ...(signature ? { 'stripe-signature': signature } : {}),
      ...(method === 'POST' ? { 'content-type': 'text/plain' } : {}),
    },
    body: method === 'POST' ? payload : undefined,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(
      `Commerce API webhook failed (${res.status})${text ? `: ${text}` : ''}`,
    )
  }
}
