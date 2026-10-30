// ---------------------------------------------------------------------------
// Order mapper — the one mapping from a stored order to the unified Order type
// ---------------------------------------------------------------------------

import type { Order, OrderFulfillmentStatus, OrderStatus, PaymentStatus } from '@prood/types'
import type { orders } from '../database/drizzle/schema/orders.js'
import { findOrderItems } from '../database/index.js'
import { isoDate, normalizeLocalizedField, price, priceRequired, img } from './helpers.js'

/** Prices use the order's own currency: it is what the customer was charged. */
export async function mapOrder(row: typeof orders.$inferSelect): Promise<Order> {
  const items = await findOrderItems(row.id)

  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status as OrderStatus,
    paymentStatus: row.paymentStatus as PaymentStatus,
    fulfillmentStatus: row.fulfillmentStatus as OrderFulfillmentStatus,
    items: items.map((i: any) => ({
      id: i.id,
      productId: i.productId,
      variantId: i.variantId ?? null,
      name: normalizeLocalizedField(i.name),
      image: i.image ? img(i.image, null) : null,
      quantity: i.quantity,
      price: priceRequired(i.price, row.currency),
      totalPrice: priceRequired(i.totalPrice, row.currency),
      fulfillmentStatus: i.fulfillmentStatus as any,
      productType: i.productType as any,
    })),
    totals: {
      subtotal: priceRequired(row.subtotal, row.currency),
      shipping: price(row.shippingCost, row.currency),
      tax: price(row.tax, row.currency),
      discount: price(row.discount, row.currency),
      total: priceRequired(row.total, row.currency),
    },
    shippingAddress: row.shippingAddress,
    billingAddress: row.billingAddress,
    shippingMethod: row.shippingMethod,
    paymentMethod: row.paymentMethod,
    trackingNumber: row.trackingNumber,
    trackingUrl: row.trackingUrl,
    note: row.note,
    customerId: row.customerId,
    contactEmail: row.contactEmail,
    requiresShipping: row.requiresShipping,
    placedAt: isoDate(row.placedAt),
    approvedAt: isoDate(row.approvedAt),
    cancelledAt: isoDate(row.cancelledAt),
    fulfilledAt: isoDate(row.fulfilledAt),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
