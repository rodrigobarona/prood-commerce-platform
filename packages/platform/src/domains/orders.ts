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
  RecordOrderPaymentInput,
} from '@prood/types'
import {
  createOrderHistory,
  findOrderById,
  findOrders,
  findPrimaryImage,
  findProductById,
  countOrdersForCustomer,
  findOrderHistory,
  transitionOrderPayment,
  updateOrder,
} from '../database/index.js'
import { getStoreCurrency } from '../tenant/store-info.js'
import { requireSellable } from './availability.js'
import { releaseCoupon } from './coupons.js'
import { listPaymentMethods, listShippingMethods } from './checkout-methods.js'
import { normalizeLocalizedField } from './helpers.js'
import { mapOrder } from './order-mapper.js'
import { recordOrder, type OrderLine } from './order-recorder.js'

// The order has its money, so another capture is a second payment, not a retry.
const MONEY_RECEIVED = ['paid', 'partially_refunded', 'refunded']

/** Add a note to an order once: providers redeliver their webhooks. */
async function noteOnce(order: { id: string; status: string }, note: string): Promise<void> {
  const history = await findOrderHistory(order.id)
  if (history.some((entry: { note: string | null }) => entry.note === note)) return
  await createOrderHistory({ orderId: order.id, fromStatus: order.status, toStatus: order.status, note })
}

export function createOrdersDomain() {
  return {
    async createOrder(input: CreateOrderInput): Promise<Order> {
      const currency = await getStoreCurrency()

      const shippingMethod = input.shippingMethodId
        ? listShippingMethods(currency).find(m => m.id === input.shippingMethodId)
        : null
      if (shippingMethod === undefined) {
        throw new CommerceError(`Unknown shipping method: ${input.shippingMethodId}`, 'VALIDATION', 422)
      }

      const paymentMethod = input.payment
        ? listPaymentMethods().find(m => m.id === input.payment?.methodId)
        : null
      if (paymentMethod === undefined) {
        throw new CommerceError(`Unknown payment method: ${input.payment?.methodId}`, 'VALIDATION', 422)
      }

      const lines: OrderLine[] = []
      for (const item of input.items) {
        if (item.unitPrice.currency !== currency) {
          throw new CommerceError(`Prices must be in ${currency}.`, 'VALIDATION', 422)
        }
        const product = await findProductById(item.productId)
        if (product?.status !== 'active') {
          throw new CommerceError(`Product not found: ${item.productId}`, 'NOT_FOUND')
        }
        const variant = await requireSellable(product, item.variantId)
        const image = await findPrimaryImage(product.id)

        lines.push({
          productId: product.id,
          variantId: variant?.id ?? null,
          name: normalizeLocalizedField(product.name),
          variantName: variant?.name ? normalizeLocalizedField(variant.name) : null,
          image: image?.url ?? null,
          quantity: item.quantity,
          price: item.unitPrice.amount,
          productType: product.productType,
          requiresShipping: product.requiresShipping,
        })
      }

      return recordOrder({
        lines,
        customerId: input.customerId,
        contactEmail: input.receiver?.email,
        shippingAddress: input.shippingAddress,
        billingAddress: input.billingAddress,
        shippingMethod,
        paymentMethod,
        paymentTransactionId: input.payment?.transactionId,
        couponCode: input.couponCode,
        note: input.note,
        historyNote: 'Order created',
      })
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
      if (input.status === 'cancelled' && order.status !== 'cancelled' && order.couponCode) {
        await releaseCoupon(order.couponCode)
      }

      await createOrderHistory({
        orderId,
        fromStatus: order.status,
        toStatus: input.status,
        note: input.note ?? null,
      })
    },

    async recordOrderPayment(orderId: string, input: RecordOrderPaymentInput): Promise<boolean> {
      return transitionOrderPayment(orderId, ['unpaid'], 'placed', {
        paymentProvider: input.provider,
        paymentTransactionId: input.transactionId,
        paymentDetails: input.details,
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

      // A retry replaces the payment on the order, so the abandoned one can still report in.
      const otherPayment = Boolean(
        input.transactionId && order.paymentTransactionId && input.transactionId !== order.paymentTransactionId,
      )
      if (otherPayment && (input.outcome === 'failed' || input.outcome === 'cancelled')) return 'stale'
      if (otherPayment && input.outcome === 'captured' && MONEY_RECEIVED.includes(order.paymentStatus)) {
        await noteOnce(
          order,
          `${input.provider} captured a second payment (${input.transactionId}) on this order. It may need a refund.`,
        )
        return 'second_payment'
      }

      // A refund needs to know where the money went.
      const payment = {
        paymentProvider: input.provider,
        ...(input.transactionId && { paymentTransactionId: input.transactionId }),
      }

      // Multibanco references stay payable for days, so money can arrive after
      // the order was cancelled. Keep it cancelled and record that it was paid.
      if (order.status === 'cancelled') {
        if (input.outcome === 'authorized') return 'duplicate'
        if (input.outcome === 'captured') {
          const paid = await transitionOrderPayment(orderId, ['unpaid', 'authorized', 'voided'], 'cancelled', { ...payment, paymentStatus: 'paid' })
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
        authorized: { note: 'Payment authorized', data: { ...payment, paymentStatus: 'authorized' } },
        captured: {
          note: 'Payment captured',
          data: {
            ...payment,
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
        // The order moved since it was read: decide again from where it is now.
        const current = await findOrderById(orderId)
        const moved = current?.status !== order.status || current?.paymentStatus !== order.paymentStatus
        return moved ? this.applyPaymentEvent(orderId, input) : 'duplicate'
      }

      if (target.data.status === 'cancelled' && order.couponCode) await releaseCoupon(order.couponCode)

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

    /** The same goods, delivery and payment method at the same prices; a coupon is not redeemed twice. */
    async duplicateOrder(orderId: string): Promise<Order> {
      const original = await this.getOrder(orderId)
      const address = original.shippingAddress
      return this.createOrder({
        customerId: original.customerId,
        receiver: original.contactEmail
          ? {
              firstName: address?.firstName ?? '',
              lastName: address?.lastName ?? '',
              email: original.contactEmail,
            }
          : null,
        shippingAddress: address,
        billingAddress: original.billingAddress,
        shippingMethodId: original.shippingMethod?.id,
        payment: original.paymentMethod ? { methodId: original.paymentMethod.id } : null,
        note: original.note,
        items: original.items.map(i => ({
          productId: i.productId,
          variantId: i.variantId,
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
