// ---------------------------------------------------------------------------
// Order payment state — what a shopper should be told about their order
// ---------------------------------------------------------------------------

import type { Maybe } from './common.js'
import type { Order, OrderPaymentDetails } from './order.js'

/**
 * - `settled`: paid, or nothing to pay
 * - `awaiting_multibanco`: unpaid, with a reference to pay at an ATM or bank
 * - `awaiting_payment`: unpaid, or a payment is still being confirmed
 * - `failed`: the payment failed or was cancelled
 * - `refunded`: money went back to the shopper
 * - `cancelled_paid`: paid after the order was cancelled, so a refund is owed
 */
export type OrderPaymentState =
  | { kind: 'settled' }
  | { kind: 'awaiting_multibanco'; details: OrderPaymentDetails & { reference: string } }
  | { kind: 'awaiting_payment' }
  | { kind: 'failed' }
  | { kind: 'refunded' }
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
    case 'partially_refunded':
      return { kind: 'refunded' }
    case 'voided':
      return { kind: 'failed' }
    case 'authorized':
      return { kind: 'awaiting_payment' }
    case 'unpaid': {
      if (order.status === 'cancelled') return { kind: 'failed' }
      const details = order.paymentDetails
      return details?.method === 'multibanco' && details.reference
        ? { kind: 'awaiting_multibanco', details: { ...details, reference: details.reference } }
        : { kind: 'awaiting_payment' }
    }
  }
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
