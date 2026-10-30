// ---------------------------------------------------------------------------
// Orders domain — order CRUD and status management
// ---------------------------------------------------------------------------

import { CommerceError } from '@prood/types'
import type {
  Order,
  CreateOrderInput,
  CustomerOrdersParams,
  PaginatedResult,
  OrderStatusInfo,
  OrderHistoryEntry,
  UpdateOrderStatusInput,
  PaymentEventInput,
  PaymentEventResult,
} from '@prood/types'
import {
  createOrder as dbCreateOrder,
  createOrderItem,
  createOrderHistory,
  findOrderById,
  findOrders,
  countOrdersForCustomer,
  findOrderHistory,
  transitionOrderPayment,
  updateOrder,
} from '../database/index.js'
import { getStoreCurrency } from '../tenant/store-info.js'
import { generateOrderNumber } from './helpers.js'
import { mapOrder } from './order-mapper.js'

export function createOrdersDomain() {
  return {
    async createOrder(input: CreateOrderInput): Promise<Order> {
      const id = crypto.randomUUID()

      const orderNumber = generateOrderNumber()
      const subtotal = input.items.reduce((sum, item) => sum + (item.unitPrice.amount * item.quantity), 0)

      await dbCreateOrder({
        id,
        orderNumber,
        customerId: input.customerId ?? null,
        status: 'placed',
        paymentStatus: subtotal === 0 ? 'free' : 'unpaid',
        fulfillmentStatus: 'unfulfilled',
        subtotal,
        total: subtotal,
        currency: await getStoreCurrency(),
        shippingAddress: input.shippingAddress as any ?? null,
        billingAddress: input.billingAddress as any ?? null,
        note: input.note ?? null,
        requiresShipping: true,
        placedAt: new Date(),
      })

      for (const item of input.items) {
        await createOrderItem({
          orderId: id,
          productId: item.productId,
          variantId: item.variantId ?? null,
          name: { en: 'Product' },
          quantity: item.quantity,
          price: item.unitPrice.amount,
          totalPrice: item.unitPrice.amount * item.quantity,
        })
      }

      await createOrderHistory({
        orderId: id,
        toStatus: 'placed',
        note: 'Order created',
      })

      const row = await findOrderById(id)
      if (!row) throw new CommerceError(`Order not found after creation: ${id}`, "NOT_FOUND")
      return mapOrder(row)
    },

    async getOrder(orderId: string): Promise<Order> {
      const row = await findOrderById(orderId)
      if (!row) throw new CommerceError(`Order not found: ${orderId}`, "NOT_FOUND")
      return mapOrder(row)
    },

    async getCustomerOrders(params?: CustomerOrdersParams): Promise<PaginatedResult<Order>> {
      const page = params?.page ?? 1
      const perPage = params?.perPage ?? 20
      const offset = (page - 1) * perPage

      if (!params?.customerId) {
        return { items: [], total: 0, page, perPage, hasMore: false }
      }

      const [rows, total] = await Promise.all([
        findOrders({ limit: perPage, offset, customerId: params.customerId }),
        countOrdersForCustomer(params.customerId),
      ])
      const orders = await Promise.all(rows.map(mapOrder))

      return {
        items: orders,
        total,
        page,
        perPage,
        hasMore: offset + perPage < total,
      }
    },

    async getOrderStatuses(): Promise<OrderStatusInfo[]> {
      const statuses = ['placed', 'approved', 'fulfilled', 'cancelled']
      const colors: Record<string, string> = {
        placed: '#F59E0B', approved: '#3B82F6',
        fulfilled: '#10B981', cancelled: '#EF4444',
      }
      const icons: Record<string, string> = {
        placed: 'clock', approved: 'check-circle',
        fulfilled: 'truck', cancelled: 'x',
      }

      return statuses.map(s => ({
        id: s,
        name: s.charAt(0).toUpperCase() + s.slice(1),
        slug: s,
        type: 'original' as const,
        color: colors[s] ?? null,
        icon: icons[s] ?? null,
        isActive: true,
        parent: null,
        children: [],
      }))
    },

    async updateOrderStatus(orderId: string, input: UpdateOrderStatusInput): Promise<void> {
      const order = await findOrderById(orderId)
      if (!order) throw new CommerceError(`Order not found: ${orderId}`, "NOT_FOUND")

      const updates: Record<string, any> = { status: input.status }
      if (input.paymentStatus) updates.paymentStatus = input.paymentStatus
      if (input.fulfillmentStatus) updates.fulfillmentStatus = input.fulfillmentStatus

      const now = new Date()
      if (input.status === 'approved' && !order.approvedAt) updates.approvedAt = now
      if (input.status === 'cancelled' && !order.cancelledAt) updates.cancelledAt = now
      if (input.status === 'fulfilled' && !order.fulfilledAt) updates.fulfilledAt = now

      await updateOrder(orderId, updates)

      await createOrderHistory({
        orderId,
        fromStatus: order.status,
        toStatus: input.status,
        note: input.note ?? null,
      })
    },

    async applyPaymentEvent(orderId: string, input: PaymentEventInput): Promise<PaymentEventResult> {
      const order = await findOrderById(orderId)
      if (!order) throw new CommerceError(`Order not found: ${orderId}`, "NOT_FOUND")

      if (input.outcome === 'captured') {
        const expectedCents = Math.round(Number(order.total) * 100)
        const receivedCents = input.amount === null ? null : Math.round(input.amount * 100)
        const currencyMatches = input.currency?.toUpperCase() === String(order.currency).toUpperCase()
        if (receivedCents !== expectedCents || !currencyMatches) {
          await createOrderHistory({
            orderId,
            fromStatus: order.status,
            toStatus: order.status,
            note:
              `${input.provider} reported ${input.amount ?? 'no amount'} ${input.currency ?? ''} ` +
              `but the order total is ${order.total} ${order.currency}. Payment not applied.`,
          })
          return 'amount_mismatch'
        }
      }

      // Multibanco references stay payable for days, so money can arrive after
      // the order was cancelled. Keep it cancelled and record that it was paid.
      if (order.status === 'cancelled') {
        if (input.outcome === 'authorized') return 'duplicate'
        if (input.outcome === 'captured') {
          const paid = await transitionOrderPayment(orderId, ['unpaid', 'authorized', 'voided'], 'cancelled', { paymentStatus: 'paid' })
          if (!paid) return 'duplicate'
          await createOrderHistory({
            orderId,
            fromStatus: 'cancelled',
            toStatus: 'cancelled',
            note: `${input.provider} captured a payment on this cancelled order. Refund it.`,
          })
          return 'order_cancelled'
        }
      }

      // Payment follows the order lifecycle; it never moves a shipped order.
      const now = new Date()
      const advances = order.status === 'placed'
      const cancels = order.status === 'placed' || order.status === 'approved'
      const voided = {
        paymentStatus: 'voided',
        ...(cancels && { status: 'cancelled', cancelledAt: order.cancelledAt ?? now }),
      }
      const next: Record<PaymentEventInput['outcome'], { note: string; data: Record<string, unknown> }> = {
        authorized: { note: 'Payment authorized', data: { paymentStatus: 'authorized' } },
        captured: {
          note: 'Payment captured',
          data: {
            paymentStatus: 'paid',
            ...(advances && { status: 'approved', approvedAt: order.approvedAt ?? now }),
          },
        },
        failed: { note: 'Payment failed', data: voided },
        cancelled: { note: 'Payment cancelled', data: voided },
      }
      const target = next[input.outcome]
      const from = input.outcome === 'authorized' ? ['unpaid'] : ['unpaid', 'authorized']

      if (!(await transitionOrderPayment(orderId, from, order.status, target.data))) {
        // The order moved since it was read: decide again from its new status.
        const current = await findOrderById(orderId)
        return current?.status === order.status ? 'duplicate' : this.applyPaymentEvent(orderId, input)
      }

      await createOrderHistory({
        orderId,
        fromStatus: order.status,
        toStatus: (target.data.status as string | undefined) ?? order.status,
        note: `${target.note} (${input.provider})`,
      })
      return 'applied'
    },

    async cancelOrder(orderId: string, note?: string): Promise<void> {
      return this.updateOrderStatus(orderId, { status: 'cancelled', note: note ?? 'Order cancelled' })
    },

    async duplicateOrder(orderId: string): Promise<Order> {
      const original = await this.getOrder(orderId)
      return this.createOrder({
        customerId: original.customerId ?? undefined,
        shippingAddress: original.shippingAddress as any ?? {
          firstName: '', lastName: '', street: '', city: '', country: '',
        },
        items: original.items.map(i => ({
          productId: i.productId,
          variantId: i.variantId ?? undefined,
          quantity: i.quantity,
          unitPrice: i.price,
        })),
      })
    },

    async getOrderHistory(orderId: string): Promise<OrderHistoryEntry[]> {
      const rows = await findOrderHistory(orderId)

      return rows.map((row: any) => ({
        id: row.id,
        orderId: row.orderId,
        action: row.toStatus,
        note: row.note ?? null,
        createdAt: row.createdAt,
      }))
    },
  }
}
