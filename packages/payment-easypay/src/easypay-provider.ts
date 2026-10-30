// ---------------------------------------------------------------------------
// EasypayPaymentProvider — Easypay 2.0 (Portugal)
// ---------------------------------------------------------------------------
//
// Methods (selected via input.metadata.method, default 'mb'):
//   - mb  : Multibanco reference  -> providerData { entity, reference }
//   - mbw : MB WAY push to phone  -> providerData { status: pending }
//   - cc  : Credit card           -> redirectUrl (Easypay hosted card page)
//
// Easypay confirms payments asynchronously via notifications; the GET endpoint
// is the server-side source of truth. Amounts are major units (EUR).
// ---------------------------------------------------------------------------

import type {
  PaymentProvider,
  PaymentSession,
  PaymentSessionStatus,
  CreatePaymentSessionInput,
  RefundInput,
  PaymentWebhookEvent,
} from '@prood/types'

import type {
  EasypayConfig,
  EasypayMethod,
  EasypaySinglePayment,
} from './types.js'

const EASYPAY_PROD = 'https://api.prod.easypay.pt'

/** Map an Easypay status string to a normalized PaymentSessionStatus. */
function mapEasypayStatus(status: string | undefined): PaymentSessionStatus {
  switch ((status ?? '').toLowerCase()) {
    case 'paid':
    case 'success':
    case 'captured':
      return 'captured'
    case 'pending':
    case 'waiting':
    case 'pending_authorisation':
      return 'pending'
    case 'processing':
      return 'processing'
    case 'failed':
    case 'declined':
    case 'error':
      return 'failed'
    case 'voided':
    case 'cancelled':
    case 'canceled':
      return 'cancelled'
    case 'refunded':
      return 'refunded'
    default:
      return 'pending'
  }
}

/** Extract a single status string from Easypay's varied status fields. */
function readStatus(p: EasypaySinglePayment): string | undefined {
  if (p.payment_status) return p.payment_status
  if (typeof p.status === 'string') return p.status
  if (Array.isArray(p.status)) return p.status[0]
  return undefined
}

function paymentToSession(
  p: EasypaySinglePayment,
  providerId: string,
  method: EasypayMethod,
  amount: number,
  currency: string,
): PaymentSession {
  const statusStr = readStatus(p)
  return {
    id: String(p.id ?? ''),
    providerId,
    status: mapEasypayStatus(statusStr),
    amount: p.value ?? amount,
    currency: (p.currency ?? currency).toUpperCase(),
    providerData: {
      method,
      entity: p.method?.entity ?? null,
      reference: p.method?.reference ?? null,
      expiresAt: p.method?.expiration_time ?? null,
      easypayStatus: statusStr ?? null,
      raw: p as unknown as Record<string, unknown>,
    },
    // Card flow returns a hosted URL; mb / mbw do not.
    redirectUrl: p.method?.url ?? null,
    createdAt: new Date().toISOString(),
  }
}

/**
 * Easypay 2.0 payment provider (Portugal).
 *
 * @example
 * ```ts
 * const easypay = new EasypayPaymentProvider({
 *   accountId: process.env.EASYPAY_ACCOUNT_ID!,
 *   apiKey: process.env.EASYPAY_API_KEY!,
 * })
 * const session = await easypay.createSession({
 *   amount: 49.9, currency: 'EUR', metadata: { method: 'mb' },
 * })
 * // session.providerData.entity / .reference -> show the Multibanco reference
 * ```
 */
export class EasypayPaymentProvider implements PaymentProvider {
  readonly id = 'easypay'
  readonly name = 'Easypay'

  private readonly accountId: string
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly defaultMethod: EasypayMethod
  private readonly phoneIndicative: string

  constructor(config: EasypayConfig) {
    this.accountId = config.accountId
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl ?? EASYPAY_PROD
    this.defaultMethod = config.defaultMethod ?? 'mb'
    this.phoneIndicative = config.phoneIndicative ?? '+351'
  }

  async createSession(input: CreatePaymentSessionInput): Promise<PaymentSession> {
    const method = (input.metadata?.method as EasypayMethod | undefined) ?? this.defaultMethod
    const reference = input.orderId ?? input.idempotencyKey ?? `cart-${Date.now()}`

    const body: Record<string, unknown> = {
      type: 'sale',
      method,
      currency: input.currency.toUpperCase(),
      key: reference,
      value: input.amount,
      capture: {
        transaction_key: reference,
        descriptive: input.orderId ? `Order ${input.orderId}` : 'Order',
      },
      customer: {
        name: [input.customer?.firstName, input.customer?.lastName].filter(Boolean).join(' ') || 'Customer',
        email: input.customer?.email ?? '',
        phone: input.customer?.phone ?? '',
        phone_indicative: this.phoneIndicative,
        key: input.customerId ?? reference,
        language: 'PT',
      },
    }

    const created = await this.request<EasypaySinglePayment>('POST', '/2.0/single', body)
    // Re-read to normalize the freshly created payment shape.
    return paymentToSession(created, this.id, method, input.amount, input.currency)
  }

  async confirmSession(sessionId: string): Promise<PaymentSession> {
    return this.getSession(sessionId)
  }

  async getSession(sessionId: string): Promise<PaymentSession> {
    const p = await this.request<EasypaySinglePayment>('GET', `/2.0/single/${sessionId}`)
    const method = (p.method?.type as EasypayMethod | undefined) ?? this.defaultMethod
    return paymentToSession(p, this.id, method, p.value ?? 0, p.currency ?? 'EUR')
  }

  async refund(input: RefundInput): Promise<PaymentSession> {
    const current = await this.getSession(input.sessionId)
    await this.request('POST', `/2.0/single/${input.sessionId}/refund`, {
      amount: input.amount ?? current.amount,
      reason: input.reason ?? 'requested_by_customer',
    })
    return this.getSession(input.sessionId)
  }

  async verifyWebhook(
    payload: string | Uint8Array,
    _signature: string,
  ): Promise<PaymentWebhookEvent> {
    // Easypay notifications are unsigned, so the body is only a trigger: the
    // payment is re-fetched from the API and that response is the source of truth.
    const bodyStr = typeof payload === 'string' ? payload : new TextDecoder().decode(payload)
    const notification = JSON.parse(bodyStr) as { id?: unknown }
    if (typeof notification.id !== 'string' || notification.id.length === 0) {
      throw new Error('Easypay: notification is missing the payment id')
    }

    const payment = await this.request<EasypaySinglePayment>(
      'GET',
      `/2.0/single/${encodeURIComponent(notification.id)}`,
    )

    return {
      type: statusToEventType(mapEasypayStatus(readStatus(payment))),
      sessionId: notification.id,
      orderId: payment.key ?? null,
      amount: typeof payment.value === 'number' ? payment.value : null,
      currency: payment.currency ? payment.currency.toUpperCase() : null,
      data: payment as unknown as Record<string, unknown>,
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'AccountId': this.accountId,
        'ApiKey': this.apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      throw new Error(`Easypay API error (${res.status}): ${errorBody}`)
    }

    return res.json() as Promise<T>
  }
}

function statusToEventType(status: PaymentSessionStatus): string {
  switch (status) {
    case 'captured': return 'payment.captured'
    case 'failed': return 'payment.failed'
    case 'cancelled': return 'payment.cancelled'
    case 'refunded': return 'payment.refunded'
    case 'processing': return 'payment.processing'
    default: return 'payment.updated'
  }
}
