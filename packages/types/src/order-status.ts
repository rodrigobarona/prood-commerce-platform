// ---------------------------------------------------------------------------
// Order status & history types — rich metadata for display & tracking
// ---------------------------------------------------------------------------

import type { Maybe } from './common.js'
import type { OrderPaymentDetails } from './order.js'

/**
 * Rich order status metadata — for displaying statuses on order tracking pages.
 *
 * Distinct from the `OrderStatus` string union (used for `Order.status`),
 * this captures platform-specific display data like colors, icons, and
 * custom sub-statuses.
 */
export interface OrderStatusInfo {
  id: string
  name: string
  slug: string
  /** Whether this is a built-in or merchant-created status */
  type: 'original' | 'custom'
  /** Hex color for status badge display */
  color: Maybe<string>
  /** Icon identifier (platform-specific) */
  icon: Maybe<string>
  /** Whether this status is active in the store's workflow */
  isActive: boolean
  /** Parent status (for custom sub-statuses under an original status) */
  parent: Maybe<{ id: string; name: string }>
  /** Child sub-statuses (custom statuses grouped under this status) */
  children: OrderStatusInfo[]
}

/**
 * A single entry in an order's status change timeline.
 *
 * Used for order tracking — shows the history of status changes,
 * notes, and actions taken on an order.
 */
export interface OrderHistoryEntry {
  id: string
  orderId: string
  /** The action/status change that occurred */
  action: string
  /** Optional note from merchant or system */
  note: Maybe<string>
  createdAt: string
}

/** A verified payment gateway outcome to apply to an order. */
export interface PaymentEventInput {
  outcome: 'authorized' | 'captured' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded'
  /** Amount reported by the gateway, in major units */
  amount: number | null
  /** ISO 4217 currency reported by the gateway */
  currency: string | null
  /** Gateway id (e.g. 'stripe') — recorded in the order history */
  provider: string
  /** Gateway's id for the payment, kept on captured orders so they can be refunded */
  transactionId?: string | null
}

/** The payment a shopper started on an order. */
export interface RecordOrderPaymentInput {
  provider: string
  /** Gateway's id for the payment */
  transactionId: string
  details: OrderPaymentDetails
}

/**
 * Result of applying a payment event:
 * - `applied` — the order moved to the new payment state
 * - `duplicate` — the order already left `unpaid`/`authorized`; nothing changed
 * - `amount_mismatch` — the gateway amount/currency differs from the order total
 * - `order_cancelled` — money arrived on a cancelled order and is owed back
 * - `stale` — the event is about a payment this order no longer uses; the order didn't change
 * - `second_payment` — another payment arrived on an order that has its money
 */
export type PaymentEventResult =
  | 'applied'
  | 'duplicate'
  | 'amount_mismatch'
  | 'order_cancelled'
  | 'stale'
  | 'second_payment'

/**
 * Input for updating an order's status.
 */
export interface UpdateOrderStatusInput {
  /** Order lifecycle status (e.g., 'placed', 'approved', 'fulfilled', 'cancelled') */
  status: string
  /** Payment lifecycle status (e.g., 'unpaid', 'paid', 'refunded', 'voided') */
  paymentStatus?: string
  /** Fulfillment lifecycle status (e.g., 'unfulfilled', 'in_progress', 'fulfilled') */
  fulfillmentStatus?: string
  /** Optional note to attach to the status change */
  note?: string
  /** Whether to restore stock for canceled/returned items */
  restoreItems?: boolean
}
