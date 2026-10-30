// ---------------------------------------------------------------------------
// Admin: Order management
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type { Order, PaginatedResult } from '@prood/types'
import type { AdminListOrdersParams, FulfillOrderInput } from './types.js'
import {
  findOrderById,
  findAllOrders,
  updateOrderTracking,
  updateOrder,
  createOrderHistory,
} from '../database/index.js'
import { mapOrder } from '../domains/order-mapper.js'

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

      await updateOrderTracking(id, {
        trackingNumber: input.trackingNumber ?? null,
        trackingUrl: input.trackingUrl ?? null,
        status: 'fulfilled',
      })

      await updateOrder(id, {
        fulfillmentStatus: 'fulfilled',
        fulfilledAt: new Date(),
      })

      await createOrderHistory({
        orderId: id,
        fromStatus: order.status,
        toStatus: 'fulfilled',
        note: input.note ?? 'Order fulfilled',
      })
    },

    async refundOrder(id: string, note?: string): Promise<void> {
      const order = await findOrderById(id)
      if (!order) throw new CommerceError(`Order not found: ${id}`, "NOT_FOUND")

      await updateOrder(id, {
        status: 'cancelled',
        paymentStatus: 'refunded',
        cancelledAt: new Date(),
      })

      await createOrderHistory({
        orderId: id,
        fromStatus: order.status,
        toStatus: 'cancelled',
        note: note ?? 'Order refunded',
      })
    },
  }
}
