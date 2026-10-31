// ---------------------------------------------------------------------------
// Refunded orders — shared by the merchant's refund and the provider's webhook
// ---------------------------------------------------------------------------

import { createOrderHistory, transitionOrderPayment } from '../database/index.js'
import { releaseCoupon } from './coupons.js'

/**
 * Cancel an order whose money went back to the shopper, while its payment is
 * still one of `from`. Returns whether this call was the one that recorded it,
 * so the shopper is told once however many sources report the refund.
 */
export async function markOrderRefunded(
  order: { id: string; status: string; couponCode: string | null; cancelledAt: Date | null },
  from: string[],
  note: string,
): Promise<boolean> {
  const recorded = await transitionOrderPayment(order.id, from, order.status, {
    status: 'cancelled',
    paymentStatus: 'refunded',
    cancelledAt: order.cancelledAt ?? new Date(),
  })
  if (!recorded) return false

  // Cancelling already released it, so a late payment must not release it again.
  if (order.status !== 'cancelled' && order.couponCode) await releaseCoupon(order.couponCode)

  await createOrderHistory({
    orderId: order.id,
    fromStatus: order.status,
    toStatus: 'cancelled',
    note,
  })
  return true
}
