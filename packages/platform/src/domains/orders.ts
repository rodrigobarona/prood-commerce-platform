// ---------------------------------------------------------------------------
// Orders domain — order CRUD and status management
// ---------------------------------------------------------------------------

import type {
  Order,
  CreateOrderInput,
  PaginationParams,
  PaginatedResult,
  OrderStatusInfo,
  OrderHistoryEntry,
  UpdateOrderStatusInput,
} from '@prood/types'
import {
  createOrder as dbCreateOrder,
  createOrderItem,
  createOrderHistory,
  findOrderById,
  findOrders,
  findOrderItems,
  findOrderHistory,
  updateOrder,
} from '../database/index.js'
import { generateOrderNumber, normalizeLocalizedField, price, priceRequired, img, parseJsonField, toNumber } from './helpers.js'

export function createOrdersDomain(currency: string) {
  /** Map DB order row + items to unified Order type */
  async function mapOrder(row: any): Promise<Order> {
    const items = await findOrderItems(row.id)

    return {
      id: row.id,
      orderNumber: row.orderNumber,
      status: row.status,
      items: items.map((i: any) => ({
        id: i.id,
        productId: i.productId,
        variantId: i.variantId ?? null,
        name: normalizeLocalizedField(i.name),
        image: i.image ? img(i.image, null) : null,
        quantity: i.quantity,
        price: priceRequired(toNumber(i.price), currency),
        totalPrice: priceRequired(toNumber(i.totalPrice), currency),
        fulfillmentStatus: i.fulfillmentStatus as any,
        productType: i.productType as any,
        digital: null,
        event: null,
      })),
      totals: {
        subtotal: priceRequired(row.subtotal, currency),
        shipping: price(row.shippingCost, currency),
        tax: price(row.tax, currency),
        discount: price(row.discount, currency),
        total: priceRequired(row.total, currency),
      },
      shippingAddress: parseJsonField(row.shippingAddress),
      billingAddress: parseJsonField(row.billingAddress),
      shippingMethod: row.shippingMethod
        ? (() => { const n = parseJsonField(row.shippingMethod); return { id: 'default', name: normalizeLocalizedField(n), provider: 'custom', fulfillmentType: 'shipping' as const, price: priceRequired(0, currency), estimatedDays: { min: 1, max: 7 }, cashOnDelivery: false } })()
        : null,
      paymentMethod: row.paymentMethod
        ? (() => { const n = parseJsonField(row.paymentMethod); return { id: 'default', type: 'card', name: normalizeLocalizedField(n), provider: 'platform', installments: null, icon: null } })()
        : null,
      trackingNumber: row.trackingNumber ?? null,
      trackingUrl: row.trackingUrl ?? null,
      note: row.note ?? null,
      customerId: row.customerId ?? null,
      contactEmail: row.contactEmail ?? null,
      requiresShipping: Boolean(row.requiresShipping),
      placedAt: row.placedAt ?? null,
      approvedAt: row.approvedAt ?? null,
      cancelledAt: row.cancelledAt ?? null,
      fulfilledAt: row.fulfilledAt ?? null,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      paymentStatus: row.paymentStatus ?? 'unpaid',
      fulfillmentStatus: row.fulfillmentStatus ?? 'unfulfilled',
      paymentTerms: null,
      purchaseOrderNumber: null,
      companyName: null,
      giftCardCodesApplied: [],
      giftCardAmountApplied: null,
    }
  }

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
        currency,
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
      return mapOrder(row)
    },

    async getOrder(orderId: string): Promise<Order> {
      const row = await findOrderById(orderId)
      if (!row) throw new Error(`Order not found: ${orderId}`)
      return mapOrder(row)
    },

    async getCustomerOrders(
      params?: PaginationParams & { customerId?: string },
    ): Promise<PaginatedResult<Order>> {
      const page = params?.page ?? 1
      const perPage = params?.perPage ?? 20
      const offset = (page - 1) * perPage

      if (!params?.customerId) {
        return { items: [], total: 0, page, perPage, hasMore: false }
      }

      const rows = await findOrders({ limit: perPage, offset, customerId: params.customerId })
      const orders = await Promise.all(rows.map(mapOrder))

      return {
        items: orders,
        total: orders.length,
        page,
        perPage,
        hasMore: orders.length === perPage,
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
      if (!order) throw new Error(`Order not found: ${orderId}`)

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
