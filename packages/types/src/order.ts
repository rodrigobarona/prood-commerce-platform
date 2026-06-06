// ---------------------------------------------------------------------------
// Order domain types
// ---------------------------------------------------------------------------

import type { Id, Image, LocalizedString, Maybe, Price } from './common.js'
import type { Address } from './customer.js'
import type { ShippingMethod } from './shipping.js'
import type { PaymentMethod } from './payment.js'
import type { CartTotals } from './cart.js'
import type { ProductType, DigitalProductMeta, EventProductMeta } from './product.js'
import type { PaymentTerms } from './wholesale.js'

/** Order status lifecycle (Commerce Layer-inspired) */
export type OrderStatus =
  | 'placed'
  | 'approved'
  | 'fulfilled'
  | 'cancelled'

/** Payment status — independent dimension tracking payment lifecycle */
export type PaymentStatus =
  | 'unpaid'
  | 'authorized'
  | 'paid'
  | 'partially_refunded'
  | 'refunded'
  | 'voided'
  | 'free'

/** Order-level fulfillment status */
export type OrderFulfillmentStatus =
  | 'unfulfilled'
  | 'in_progress'
  | 'fulfilled'
  | 'not_required'

/** Fulfillment status per line item */
export type FulfillmentStatus =
  | 'unfulfilled'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'returned'
  // Digital / service / event specific
  | 'download_ready'
  | 'license_sent'
  | 'access_granted'
  | 'ticket_issued'

/** A single item within an order */
export interface OrderItem {
  id: Id
  productId: Id
  variantId: Maybe<Id>
  name: LocalizedString
  image: Maybe<Image>
  quantity: number
  price: Price
  totalPrice: Price
  fulfillmentStatus: FulfillmentStatus

  /** Product type — drives post-purchase UX (download button vs tracking) */
  productType: ProductType

  /** Digital fulfillment details (populated after purchase for digital products) */
  digital: Maybe<DigitalProductMeta>

  /** Event/ticket details (populated for event products) */
  event: Maybe<EventProductMeta>
}

/** Order entity */
export interface Order {
  id: Id
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  fulfillmentStatus: OrderFulfillmentStatus
  items: OrderItem[]
  totals: CartTotals
  shippingAddress: Maybe<Address>
  billingAddress: Maybe<Address>
  shippingMethod: Maybe<ShippingMethod>
  paymentMethod: Maybe<PaymentMethod>
  /** Tracking number from shipping provider */
  trackingNumber: Maybe<string>
  /** Tracking URL */
  trackingUrl: Maybe<string>
  note: Maybe<string>
  customerId: Maybe<Id>
  /** Email address provided at checkout */
  contactEmail: Maybe<string>
  /** Whether any item in this order requires physical shipping */
  requiresShipping: boolean

  placedAt: Maybe<string>
  approvedAt: Maybe<string>
  cancelledAt: Maybe<string>
  fulfilledAt: Maybe<string>

  createdAt: string
  updatedAt: string

  // ---- B2B / Wholesale (additive) ----

  /** Payment terms for B2B orders (null = standard payment) */
  paymentTerms: Maybe<PaymentTerms>

  /** Buyer's purchase order number reference */
  purchaseOrderNumber: Maybe<string>

  /** Company name for B2B orders */
  companyName: Maybe<string>

  // ---- Gift cards ----

  /** Gift card codes applied to this order */
  giftCardCodesApplied: string[]

  /** Total gift card amount deducted */
  giftCardAmountApplied: Maybe<Price>
}
