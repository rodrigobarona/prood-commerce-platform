// ---------------------------------------------------------------------------
// StripePaymentProvider — Checkout Sessions API + embedded Payment Element
// ---------------------------------------------------------------------------
//
// Flow (ui_mode: "elements"):
//   1. server: createSession() → Checkout Session with client_secret
//   2. client: <CheckoutElementsProvider> + <PaymentElement> + checkout.confirm()
//   3. server: checkout.session.completed webhook is the source of truth
//
// Amounts: PaymentProvider uses major units (99.99); Stripe uses the
// smallest currency unit — we convert honoring zero-decimal currencies.
// ---------------------------------------------------------------------------

import Stripe from 'stripe'
import type {
  PaymentProvider,
  PaymentSession,
  PaymentSessionStatus,
  CreatePaymentSessionInput,
  RefundInput,
  PaymentWebhookEvent,
} from '@prood/types'

import type { StripeConfig } from './types.js'

// ---------------------------------------------------------------------------
// Currency helpers
// ---------------------------------------------------------------------------

const ZERO_DECIMAL_CURRENCIES = new Set([
  'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA',
  'PYG', 'RWF', 'UGX', 'VND', 'VUV', 'XAF', 'XOF', 'XPF',
])

function toMinorUnits(amount: number, currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())
    ? Math.round(amount)
    : Math.round(amount * 100)
}

function fromMinorUnits(amount: number, currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency.toUpperCase())
    ? amount
    : amount / 100
}

// ---------------------------------------------------------------------------
// Checkout Session → PaymentSession mapping
// ---------------------------------------------------------------------------

function getPaymentIntentId(session: Stripe.Checkout.Session): string | null {
  return typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null
}

/**
 * Map Checkout Session status + payment_status to a normalized status.
 *
 * - complete + paid        → captured  (automatic capture)
 * - complete + unpaid      → authorized (manual capture / async pending)
 * - complete + no_payment  → captured  (free order)
 * - expired                → cancelled
 * - open / null            → pending
 */
function mapSessionStatus(session: Stripe.Checkout.Session): PaymentSessionStatus {
  switch (session.status) {
    case 'complete':
      return session.payment_status === 'unpaid' ? 'authorized' : 'captured'
    case 'expired':
      return 'cancelled'
    default:
      return 'pending'
  }
}

function sessionToPaymentSession(
  session: Stripe.Checkout.Session,
  providerId: string,
): PaymentSession {
  return {
    id: session.id,
    providerId,
    status: mapSessionStatus(session),
    amount: fromMinorUnits(session.amount_total ?? 0, session.currency ?? 'usd'),
    currency: (session.currency ?? 'usd').toUpperCase(),
    providerData: {
      clientSecret: session.client_secret,
      checkoutSessionId: session.id,
      paymentIntentId: getPaymentIntentId(session),
      stripeStatus: session.status,
      paymentStatus: session.payment_status,
    },
    redirectUrl: null,
    createdAt: new Date(session.created * 1000).toISOString(),
  }
}

// ---------------------------------------------------------------------------
// Webhook helpers
// ---------------------------------------------------------------------------

const VALID_REFUND_REASONS = new Set<string>([
  'duplicate',
  'fraudulent',
  'requested_by_customer',
])

function extractSessionId(event: Stripe.Event): string {
  const object = event.data.object as unknown as Record<string, unknown>

  // checkout.session.* → object IS the Checkout Session; use its ID directly
  if (event.type.startsWith('checkout.session.')) {
    return object.id as string
  }

  // charge/refund events → extract the PaymentIntent ID for cross-reference
  const pi = object.payment_intent
  if (typeof pi === 'string') return pi
  if (pi && typeof pi === 'object' && 'id' in pi) return (pi as { id: string }).id

  return object.id as string
}

/**
 * Map a Stripe event to a normalized commerce webhook event type.
 *
 * Checkout Session events are the source of truth. For `checkout.session.completed`,
 * we inspect `payment_status` to distinguish captured (auto) from authorized (manual).
 */
function mapEventType(event: Stripe.Event): string {
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      return session.payment_status === 'paid' ? 'payment.captured' : 'payment.authorized'
    }
    case 'checkout.session.async_payment_succeeded':
      return 'payment.captured'
    case 'checkout.session.expired':
      return 'payment.cancelled'
    case 'checkout.session.async_payment_failed':
      return 'payment.failed'
    case 'charge.refunded':
    case 'refund.created':
      return 'payment.refunded'
    default:
      return 'payment.updated'
  }
}

// ---------------------------------------------------------------------------
// StripePaymentProvider
// ---------------------------------------------------------------------------

/**
 * Stripe payment provider using Checkout Sessions API with embedded Payment Element.
 *
 * @example
 * ```ts
 * const stripe = new StripePaymentProvider({ secretKey: process.env.STRIPE_SECRET_KEY! })
 * const session = await stripe.createSession({ amount: 49.9, currency: 'EUR' })
 * // hand session.providerData.clientSecret to <CheckoutElementsProvider>
 * ```
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly id = 'stripe'
  readonly name = 'Stripe'

  private readonly stripe: Stripe
  private readonly webhookSecret: string | null
  private readonly captureMethod: 'automatic' | 'manual'

  constructor(config: StripeConfig) {
    this.stripe = config.client
      ?? new Stripe(
        config.secretKey,
        (config.apiVersion
          ? { apiVersion: config.apiVersion }
          : {}) as ConstructorParameters<typeof Stripe>[1],
      )
    this.webhookSecret = config.webhookSecret ?? null
    this.captureMethod = config.captureMethod ?? 'automatic'
  }

  // ---- Core lifecycle -------------------------------------------------------

  async createSession(input: CreatePaymentSessionInput): Promise<PaymentSession> {
    const metadata: Record<string, string> = {}
    if (input.orderId) metadata.orderId = input.orderId
    if (input.customerId) metadata.customerId = input.customerId
    for (const [k, v] of Object.entries(input.metadata ?? {})) {
      metadata[k] = typeof v === 'string' ? v : JSON.stringify(v)
    }

    if (!input.returnUrl) {
      throw new Error('returnUrl is required for Stripe Checkout Sessions with ui_mode: elements')
    }

    const session = await this.stripe.checkout.sessions.create(
      {
        ui_mode: 'elements',
        mode: 'payment',
        return_url: input.returnUrl,
        line_items: [{
          price_data: {
            currency: input.currency.toLowerCase(),
            unit_amount: toMinorUnits(input.amount, input.currency),
            product_data: {
              name: input.orderId ? `Order ${input.orderId}` : 'Payment',
            },
          },
          quantity: 1,
        }],
        ...(input.customer?.email && { customer_email: input.customer.email }),
        ...(this.captureMethod !== 'automatic' || input.saveCard
          ? {
            payment_intent_data: {
              ...(this.captureMethod !== 'automatic' && { capture_method: this.captureMethod }),
              ...(input.saveCard && { setup_future_usage: 'off_session' as const }),
            },
          }
          : {}),
        metadata,
      },
      input.idempotencyKey ? { idempotencyKey: input.idempotencyKey } : undefined,
    )

    return sessionToPaymentSession(session, this.id)
  }

  async confirmSession(sessionId: string): Promise<PaymentSession> {
    return this.getSession(sessionId)
  }

  async getSession(sessionId: string): Promise<PaymentSession> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId)
    return sessionToPaymentSession(session, this.id)
  }

  // ---- Post-payment operations ----------------------------------------------

  async refund(input: RefundInput): Promise<PaymentSession> {
    const session = await this.stripe.checkout.sessions.retrieve(input.sessionId)
    const piId = getPaymentIntentId(session)
    if (!piId) throw new Error(`Checkout Session ${input.sessionId} has no PaymentIntent to refund`)

    await this.stripe.refunds.create({
      payment_intent: piId,
      ...(input.amount != null && { amount: toMinorUnits(input.amount, session.currency!) }),
      ...(VALID_REFUND_REASONS.has(input.reason ?? '') && {
        reason: input.reason as Stripe.RefundCreateParams['reason'],
      }),
    })

    return this.getSession(input.sessionId)
  }

  async captureSession(sessionId: string, amount?: number): Promise<PaymentSession> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId)
    const piId = getPaymentIntentId(session)
    if (!piId) throw new Error(`Checkout Session ${sessionId} has no PaymentIntent to capture`)

    await this.stripe.paymentIntents.capture(
      piId,
      amount != null ? { amount_to_capture: toMinorUnits(amount, session.currency!) } : {},
    )

    return this.getSession(sessionId)
  }

  async cancelSession(sessionId: string): Promise<PaymentSession> {
    const session = await this.stripe.checkout.sessions.retrieve(sessionId)

    if (session.status === 'open') {
      await this.stripe.checkout.sessions.expire(sessionId)
      return this.getSession(sessionId)
    }

    if (session.status === 'complete') {
      const piId = getPaymentIntentId(session)
      if (!piId) throw new Error(`Checkout Session ${sessionId} has no PaymentIntent to cancel`)
      await this.stripe.paymentIntents.cancel(piId)
      return { ...sessionToPaymentSession(session, this.id), status: 'cancelled' }
    }

    // Already expired — return as-is
    return sessionToPaymentSession(session, this.id)
  }

  // ---- Webhooks -------------------------------------------------------------

  async verifyWebhook(
    payload: string | Uint8Array,
    signature: string,
  ): Promise<PaymentWebhookEvent> {
    if (!this.webhookSecret) {
      throw new Error('StripePaymentProvider: webhookSecret is required to verify webhooks')
    }

    const body = typeof payload === 'string' ? payload : Buffer.from(payload)
    const event = await this.stripe.webhooks.constructEventAsync(body, signature, this.webhookSecret)

    return {
      type: mapEventType(event),
      sessionId: extractSessionId(event),
      data: event as unknown as Record<string, unknown>,
    }
  }
}
