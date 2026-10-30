// ---------------------------------------------------------------------------
// Order creation input types
// ---------------------------------------------------------------------------
// Used by OrderAdapter.createOrder() — platform-agnostic order creation.
// The checkout engine (or any caller) builds this from cart + session data
// and the adapter maps it to the platform's API shape.
// ---------------------------------------------------------------------------

import type { Id, Maybe, Price } from './common.js'
import type { CheckoutAddress } from './customer.js'

/** A single item to include in the order */
export interface OrderItemInput {
  productId: Id
  variantId?: Maybe<Id>
  quantity: number
  /** Unit price charged, in the store's currency */
  unitPrice: Price
}

/** Input for creating a new order via the adapter */
export interface CreateOrderInput {
  /** Items to include in the order */
  items: OrderItemInput[]

  /** Customer ID if known (existing customer) */
  customerId?: Maybe<Id>

  /** Who receives the order; its email becomes the order's contact email */
  receiver?: Maybe<{
    firstName: string
    lastName: string
    email: string
    phone?: string
  }>

  /** Shipping address. Required when any item ships */
  shippingAddress?: Maybe<CheckoutAddress>

  /** Billing address (defaults to shipping if not provided) */
  billingAddress?: Maybe<CheckoutAddress>

  /** Selected shipping method ID. Required when any item ships */
  shippingMethodId?: Maybe<string>

  /** Payment method or reference */
  payment?: Maybe<{
    /** Payment method ID or type */
    methodId: string
    /** External transaction reference (e.g., Stripe PaymentIntent ID) */
    transactionId?: string
  }>

  /** Coupon to redeem on this order */
  couponCode?: Maybe<string>

  /** Customer-facing order note */
  note?: Maybe<string>
}
