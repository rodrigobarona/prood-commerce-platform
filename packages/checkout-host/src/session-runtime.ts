import 'server-only'
import { CheckoutSession } from '@prood/checkout'
import type { CheckoutSnapshot } from '@prood/checkout'
import type { PaymentProvider } from '@prood/types'
import { getTenantPaymentProvider, resolveCheckoutBaseUrl } from '@prood/commerce'
import { loadSession, saveSession, type SessionMeta } from './session-store'

/** Rebuild a live CheckoutSession from its Redis-stored snapshot. */
export function hydrateSession(
  snapshot: CheckoutSnapshot,
  meta: SessionMeta,
  provider: PaymentProvider,
  sessionId: string,
): CheckoutSession {
  return CheckoutSession.fromSnapshot(snapshot, {
    paymentProvider: provider,
    returnUrl: `${resolveCheckoutBaseUrl()}/confirm/${sessionId}`,
    cancelUrl: meta.cancelUrl ?? undefined,
    webhookUrl: meta.webhookUrl ?? undefined,
  })
}

export interface LoadedSession {
  session: CheckoutSession
  snapshot: CheckoutSnapshot
  meta: SessionMeta
  provider: PaymentProvider
}

/**
 * Load a session from Redis, hydrate it, and return all pieces.
 * Returns null if not found. Pass `includeDisabled` to read a payment that's
 * already under way on a provider the store has since disabled.
 */
export async function loadAndHydrate(
  sessionId: string,
  options?: { includeDisabled?: boolean },
): Promise<LoadedSession | null> {
  const stored = await loadSession(sessionId)
  if (!stored) return null

  const { provider } = await getTenantPaymentProvider(
    stored.meta.tenantId,
    stored.meta.providerId,
    options,
  )
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
