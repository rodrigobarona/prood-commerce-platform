// ---------------------------------------------------------------------------
// Order payment state — what a shopper should be told about their order
// ---------------------------------------------------------------------------

import type { Maybe } from './common.js'
import type { Order, OrderPaymentDetails, PaymentStatus } from './order.js'

/** Nothing is owed on these, so the order can ship. A partial refund leaves the sale standing. */
export const SETTLED_PAYMENTS: readonly PaymentStatus[] = ['paid', 'free', 'partially_refunded']

/** Set on the confirm page's URL by a hosted page that turned a card down. */
export const PAYMENT_DECLINED_PARAM = 'payment'
export const PAYMENT_DECLINED_VALUE = 'failed'

/** How long a shopper has to approve an MB WAY request in the app. */
export const MBWAY_WINDOW_MS = 5 * 60 * 1000

/**
 * - `settled`: paid, or nothing to pay
 * - `awaiting_multibanco`: unpaid, with a reference to pay at an ATM or bank
 * - `awaiting_payment`: unpaid, or a payment is still being confirmed
 * - `failed`: the payment failed or was cancelled
 * - `refunded`: all the money went back to the shopper
 * - `partially_refunded`: some money went back, and the order carries on
 * - `cancelled_paid`: the store holds money for a cancelled order, so a refund is owed
 */
export type OrderPaymentState =
  | { kind: 'settled' }
  | { kind: 'awaiting_multibanco'; details: OrderPaymentDetails & { reference: string } }
  | { kind: 'awaiting_payment' }
  | { kind: 'failed' }
  | { kind: 'refunded' }
  | { kind: 'partially_refunded' }
  | { kind: 'cancelled_paid' }

export function orderPaymentState(
  order: Pick<Order, 'status' | 'paymentStatus' | 'paymentDetails'>,
): OrderPaymentState {
  switch (order.paymentStatus) {
    case 'paid':
      return order.status === 'cancelled' ? { kind: 'cancelled_paid' } : { kind: 'settled' }
    case 'free':
      return { kind: 'settled' }
    case 'refunded':
      return { kind: 'refunded' }
    case 'partially_refunded':
      return order.status === 'cancelled' ? { kind: 'cancelled_paid' } : { kind: 'partially_refunded' }
    case 'voided':
      return { kind: 'failed' }
    case 'authorized':
      return order.status === 'cancelled' ? { kind: 'failed' } : { kind: 'awaiting_payment' }
    case 'unpaid': {
      if (order.status === 'cancelled') return { kind: 'failed' }
      const details = order.paymentDetails
      return details?.method === 'multibanco' && details.reference
        ? { kind: 'awaiting_multibanco', details: { ...details, reference: details.reference } }
        : { kind: 'awaiting_payment' }
    }
  }
}

export interface OrderOutcome {
  /** How the order says the payment ended, or `pending` while the provider holds it */
  state: 'complete' | 'failed' | 'pending' | null
  /** Whether a new payment may start */
  payable: boolean
}

/**
 * Webhooks update the order, never the checkout session, so the order decides
 * how a session ended. Sessions without an order are always payable.
 */
export function orderOutcome(
  order: Pick<Order, 'status' | 'paymentStatus'> | null,
): OrderOutcome {
  if (!order) return { state: null, payable: true }
  // Money on a cancelled order is owed back, so that is no completed purchase.
  if (SETTLED_PAYMENTS.includes(order.paymentStatus) && order.status !== 'cancelled') {
    return { state: 'complete', payable: false }
  }
  // Same answer as orderPaymentState: authorized funds are still being confirmed.
  if (order.paymentStatus === 'authorized' && order.status !== 'cancelled') {
    return { state: 'pending', payable: false }
  }
  const payable = order.status === 'placed' && order.paymentStatus === 'unpaid'
  return { state: payable ? null : 'failed', payable }
}

/**
 * The nine-digit Portuguese mobile number MB WAY needs, from any way a shopper
 * might write it, or null if it isn't one.
 */
export function toPortugueseMobile(phone: Maybe<string> | undefined): string | null {
  const digits = (phone ?? '').replace(/[\s().#+-]/g, '')
  const national = digits.replace(/^(00)?351(?=\d{9}$)/, '')
  return /^9\d{8}$/.test(national) ? national : null
}
