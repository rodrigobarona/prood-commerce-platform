// ---------------------------------------------------------------------------
// Admin: Order management
// ---------------------------------------------------------------------------

import { CommerceError, SETTLED_PAYMENTS } from '@prood/types'
import type { Order, PaginatedResult, PaymentStatus } from '@prood/types'
import type { AdminListOrdersParams, FulfillOrderInput } from './types.js'
import {
  findOrderById,
  findAllOrders,
  createOrderHistory,
  transitionOrderPayment,
} from '../database/index.js'
import { mapOrder } from '../domains/order-mapper.js'
import { markOrderRefunded } from '../domains/order-refund.js'

export function createAdminOrdersDomain() {
  async function fullOrder(id: string): Promise<Order> {
    const row = await findOrderById(id)
    if (!row) throw new CommerceError(`Order not found: ${id}`, "NOT_FOUND")
    return mapOrder(row)
  }

  return {
    async listOrders(params?: AdminListOrdersParams): Promise<PaginatedResult<Order>> {
      const page = params?.page ?? 1
      const perPage = params?.perPage ?? 20
      const offset = (page - 1) * perPage

      const { rows, total } = await findAllOrders({
        status: params?.status,
        customerId: params?.customerId,
        dateFrom: params?.dateFrom,
        dateTo: params?.dateTo,
        search: params?.search,
        limit: perPage,
        offset,
      })

      const orders = await Promise.all(rows.map(mapOrder))

      return {
        items: orders,
        total,
        page,
        perPage,
        hasMore: offset + perPage < total,
      }
    },

    getOrder: fullOrder,

    async fulfillOrder(id: string, input: FulfillOrderInput): Promise<void> {
      const order = await findOrderById(id)
      if (!order) throw new CommerceError(`Order not found: ${id}`, "NOT_FOUND")
      // A refund cancels the order, so this also stops refunded goods from shipping.
      if (order.status === 'cancelled') {
        throw new CommerceError("A cancelled order can't be fulfilled.", 'VALIDATION', 422)
      }
      if (order.status === 'fulfilled') {
        throw new CommerceError('This order is already fulfilled.', 'VALIDATION', 422)
      }
      if (order.fulfillmentStatus === 'not_required') {
        throw new CommerceError('This order has nothing to ship.', 'VALIDATION', 422)
      }
      if (!SETTLED_PAYMENTS.includes(order.paymentStatus as PaymentStatus)) {
        throw new CommerceError("This order can't ship until it's paid.", 'VALIDATION', 422)
      }

      const fulfilled = await transitionOrderPayment(id, [order.paymentStatus], order.status, {
        status: 'fulfilled',
        fulfillmentStatus: 'fulfilled',
        fulfilledAt: new Date(),
        trackingNumber: input.trackingNumber ?? null,
        trackingUrl: input.trackingUrl ?? null,
      })
      if (!fulfilled) {
        throw new CommerceError('This order changed while it was being fulfilled. Review it and try again.', 'VALIDATION', 409)
      }

      await createOrderHistory({
        orderId: id,
        fromStatus: order.status,
        toStatus: 'fulfilled',
        note: input.note ?? 'Order fulfilled',
      })
    },

    /**
     * Record that a paid order's money went back to the shopper. Sending the
     * money is the caller's job, and this moves none: call it only afterwards.
     */
    async recordRefund(id: string, note?: string): Promise<void> {
      const order = await findOrderById(id)
      if (!order) throw new CommerceError(`Order not found: ${id}`, "NOT_FOUND")
      if (order.paymentStatus !== 'paid') {
        throw new CommerceError('Only paid orders can be refunded.', 'VALIDATION', 422)
      }

      if (!(await markOrderRefunded(order, ['paid'], note ?? 'Order refunded'))) {
        throw new CommerceError('This order changed while it was being refunded.', 'VALIDATION', 409)
      }
    },
  }
}
