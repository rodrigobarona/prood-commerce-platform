import type Stripe from 'stripe'

/** Configuration for {@link StripePaymentProvider}. */
export interface StripeConfig {
  /** Stripe secret key (`sk_test_...` / `sk_live_...`). Server-side only. */
  secretKey: string
  /** Publishable key (`pk_test_...` / `pk_live_...`), checked against the secret key's mode. */
  publishableKey?: string
  /** Webhook signing secret (`whsec_...`) used by `verifyWebhook`. */
  webhookSecret?: string
  /**
   * Capture method. `automatic` (default) captures on confirmation;
   * `manual` authorizes only and requires {@link StripePaymentProvider.captureSession}.
   */
  captureMethod?: 'automatic' | 'manual'
  /** Optional Stripe API version override. Omit to use the SDK default. */
  apiVersion?: string
  /** Optional pre-constructed Stripe client (useful for testing). */
  client?: Stripe
}
