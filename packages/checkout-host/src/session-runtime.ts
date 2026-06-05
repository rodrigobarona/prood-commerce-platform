import 'server-only'
import { CheckoutSession } from '@prood/checkout'
import type { CheckoutSnapshot } from '@prood/checkout'
import type { PaymentProvider } from '@prood/types'
import { getPaymentProvider, getTenantPaymentConfig } from '@prood/commerce'
import { loadSession, saveSession, type SessionMeta, type StoredSession } from './session-store'
import { resolveCheckoutBaseUrl } from './checkout-url'

/**
 * Hydrate a live CheckoutSession from a Redis-stored snapshot.
 *
 * CheckoutSession has no `fromSnapshot()` so we reconstruct by:
 * 1. Creating a new session with the same config
 * 2. Replaying state transitions to match the snapshot
 */
export function hydrateSession(
  snapshot: CheckoutSnapshot,
  meta: SessionMeta,
  provider: PaymentProvider,
  sessionId?: string,
): CheckoutSession {
  const checkoutBaseUrl = resolveCheckoutBaseUrl()
  const confirmUrl = sessionId
    ? `${checkoutBaseUrl}/confirm/${sessionId}`
    : meta.returnUrl ?? undefined

  const session = new CheckoutSession({
    paymentProvider: provider,
    currency: snapshot.currency,
    amount: snapshot.amount,
    returnUrl: confirmUrl,
    cancelUrl: meta.cancelUrl ?? undefined,
    orderId: snapshot.orderId ?? undefined,
    webhookUrl: meta.webhookUrl ?? undefined,
    channel: snapshot.channel,
    fulfillment: snapshot.fulfillment,
    expiresIn: snapshot.expiresAt
      ? Math.max(new Date(snapshot.expiresAt).getTime() - Date.now(), 1000)
      : undefined,
  })

  if (snapshot.customerInfo && snapshot.state !== 'idle') {
    session.setCustomerInfo(snapshot.customerInfo)
  }

  if (
    snapshot.shippingAddress &&
    (snapshot.state === 'shipping' || snapshot.state === 'payment' ||
     snapshot.state === 'confirming' || snapshot.state === 'complete' || snapshot.state === 'failed')
  ) {
    session.setShippingAddress(snapshot.shippingAddress, snapshot.billingAddress ?? undefined)
  }

  if (snapshot.shippingMethodId && session.state === 'shipping') {
    session.setShippingMethod(snapshot.shippingMethodId)
  }

  return session
}

export interface LoadedSession {
  session: CheckoutSession
  snapshot: CheckoutSnapshot
  meta: SessionMeta
  provider: PaymentProvider
}

/**
 * Load a session from Redis, hydrate it, and return all pieces.
 * Returns null if not found.
 */
export async function loadAndHydrate(sessionId: string): Promise<LoadedSession | null> {
  const stored = await loadSession(sessionId)
  if (!stored) return null

  const tenantConfig = stored.meta.tenantId
    ? await getTenantPaymentConfig(stored.meta.tenantId, stored.meta.providerId)
    : undefined
  const provider = getPaymentProvider(stored.meta.providerId, tenantConfig)
  const session = hydrateSession(stored.snapshot, stored.meta, provider, sessionId)

  return {
    session,
    snapshot: stored.snapshot,
    meta: stored.meta,
    provider,
  }
}

/**
 * Persist a session back to Redis after mutations.
 */
export async function persistSession(
  sessionId: string,
  session: CheckoutSession,
  meta: SessionMeta,
): Promise<CheckoutSnapshot> {
  const snapshot = session.toSnapshot()
  await saveSession(sessionId, snapshot, meta)
  return snapshot
}
