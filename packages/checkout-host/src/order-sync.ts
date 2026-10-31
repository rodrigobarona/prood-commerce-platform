import 'server-only'
import type { CheckoutSession } from '@prood/checkout'
import { getAdapter, getOrder, withTenant } from '@prood/commerce'
import type { Order, OrderOutcome, PaymentMethodKind, PaymentSession } from '@prood/types'
import type { SessionMeta } from './session-store'

// Webhooks update the order, never the session, so the order decides how a
// session ended: Ifthenpay's API can't report a payment at all.

export async function loadSessionOrder(meta: SessionMeta): Promise<Order | null> {
  return meta.orderId ? getOrder(meta.orderId, meta.tenantId) : null
}

/** Move a session to the outcome its order already reached. */
export function syncSessionWithOrder(session: CheckoutSession, outcome: OrderOutcome): void {
  const payment = session.paymentSession
  if (!payment || !outcome.state || outcome.state === 'pending' || session.state === outcome.state) return
  session.handleWebhookUpdate({
    ...payment,
    status: outcome.state === 'complete' ? 'captured' : 'failed',
  })
}

/** Put a started payment on its order, so a refund and the store's pages can find it. */
export async function recordStartedPayment(
  meta: SessionMeta,
  payment: PaymentSession,
  method: PaymentMethodKind,
): Promise<void> {
  const { orderId } = meta
  if (!orderId) return
  const data = payment.providerData
  const text = (key: string) => (typeof data?.[key] === 'string' ? data[key] : null)
  const recorded = await withTenant(meta.tenantId, async () =>
    (await getAdapter()).recordOrderPayment(orderId, {
      provider: meta.providerId,
      transactionId: payment.id,
      details: {
        method,
        entity: text('entity'),
        reference: text('reference'),
        expiresAt: text('expiresAt'),
      },
    }),
  )
  if (!recorded) console.error(`[checkout] order ${orderId} stopped waiting for payment during /pay`)
}
