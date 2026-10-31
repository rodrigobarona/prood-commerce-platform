// ---------------------------------------------------------------------------
// Order recorder — the one way an order comes to exist
// ---------------------------------------------------------------------------
// Checkout and direct order creation both end here, so an order always has its
// shipping, its coupon and a total equal to what the shopper is charged.

import { CommerceError } from '@prood/types'
import type {
  CheckoutAddress,
  LocalizedField,
  Maybe,
  Order,
  PaymentMethod,
  ProductType,
  ShippingMethod,
} from '@prood/types'
import {
  createOrder as dbCreateOrder,
  createOrderItem,
  createOrderHistory,
  findOrderById,
} from '../database/index.js'
import { getStoreCurrency } from '../tenant/store-info.js'
import { redeemCoupon } from './coupons.js'
import { generateOrderNumber, roundMoney } from './helpers.js'
import { mapOrder } from './order-mapper.js'

export interface OrderLine {
  productId: string
  variantId: Maybe<string>
  name: LocalizedField
  variantName: Maybe<LocalizedField>
  image: Maybe<string>
  quantity: number
  /** Unit price, in the store's currency */
  price: number
  productType: ProductType | string
  requiresShipping: boolean
}

export interface OrderDraft {
  lines: OrderLine[]
  customerId?: Maybe<string>
  contactEmail?: Maybe<string>
  shippingAddress?: Maybe<CheckoutAddress>
  billingAddress?: Maybe<CheckoutAddress>
  shippingMethod?: Maybe<ShippingMethod>
  paymentMethod?: Maybe<PaymentMethod>
  paymentTransactionId?: Maybe<string>
  couponCode?: Maybe<string>
  note?: Maybe<string>
  historyNote: string
}

/** Must run inside withTenant: a refused coupon or failed write leaves nothing behind. */
export async function recordOrder(draft: OrderDraft): Promise<Order> {
  const requiresShipping = draft.lines.some(line => line.requiresShipping)
  if (requiresShipping && !draft.shippingAddress) {
    throw new CommerceError('Add a shipping address before placing the order.', 'VALIDATION', 422)
  }
  if (requiresShipping && !draft.shippingMethod) {
    throw new CommerceError('Choose a shipping method before placing the order.', 'VALIDATION', 422)
  }

  const currency = await getStoreCurrency()
  const lines = draft.lines.map(line => ({
    ...line,
    totalPrice: roundMoney(line.price * line.quantity),
  }))
  const subtotal = roundMoney(lines.reduce((sum, line) => sum + line.totalPrice, 0))
  const shippingMethod = requiresShipping ? draft.shippingMethod ?? null : null
  const shippingCost = shippingMethod?.price.amount ?? 0

  const discount = draft.couponCode
    ? await redeemCoupon(draft.couponCode, {
        lines,
        subtotal,
        shipping: shippingCost,
        currency,
        customerId: draft.customerId,
        contactEmail: draft.contactEmail,
      })
    : 0
  const total = roundMoney(subtotal + shippingCost - discount)
  // Nothing to pay means no payment event will ever approve the order.
  const status = total === 0 ? 'approved' : 'placed'
  const now = new Date()

  const orderId = crypto.randomUUID()
  await dbCreateOrder({
    id: orderId,
    orderNumber: generateOrderNumber(),
    customerId: draft.customerId ?? null,
    contactEmail: draft.contactEmail ?? null,
    status,
    paymentStatus: total === 0 ? 'free' : 'unpaid',
    fulfillmentStatus: requiresShipping ? 'unfulfilled' : 'not_required',
    subtotal,
    shippingCost,
    tax: 0,
    discount,
    total,
    currency,
    shippingAddress: draft.shippingAddress ?? null,
    billingAddress: draft.billingAddress ?? draft.shippingAddress ?? null,
    shippingMethod,
    paymentMethod: draft.paymentMethod ?? null,
    paymentTransactionId: draft.paymentTransactionId ?? null,
    // Only a coupon that took a use is on the order: cancelling gives that use
    // back, and per-customer limits count it.
    couponCode: discount > 0 ? draft.couponCode : null,
    note: draft.note ?? null,
    requiresShipping,
    placedAt: now,
    approvedAt: status === 'approved' ? now : null,
  })

  for (const line of lines) {
    await createOrderItem({
      orderId,
      productId: line.productId,
      variantId: line.variantId,
      name: line.name,
      variantName: line.variantName,
      image: line.image,
      quantity: line.quantity,
      price: line.price,
      totalPrice: line.totalPrice,
      productType: line.productType,
      fulfillmentStatus: 'unfulfilled',
    })
  }

  await createOrderHistory({
    orderId,
    fromStatus: null,
    toStatus: status,
    note: draft.historyNote,
  })

  const order = await findOrderById(orderId)
  if (!order) throw new CommerceError(`Order not found after creation: ${orderId}`, 'NOT_FOUND')
  return mapOrder(order)
}
