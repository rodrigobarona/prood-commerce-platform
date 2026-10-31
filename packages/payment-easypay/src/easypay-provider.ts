// ---------------------------------------------------------------------------
// EasypayPaymentProvider — Easypay 2.0 (Portugal)
// ---------------------------------------------------------------------------
//
// Methods (selected via input.method, default 'multibanco'):
//   - multibanco : reference     -> providerData { entity, reference, expiresAt }
//   - mbway      : push to phone -> providerData { status: pending }
//   - card       : hosted page   -> redirectUrl (Easypay hosted card page)
//
// Easypay confirms payments asynchronously via notifications; the GET endpoint
// is the server-side source of truth. Amounts are major units (EUR).
// ---------------------------------------------------------------------------

import { toPortugueseMobile } from '@prood/types'
import type {
  CredentialCheck,
  PaymentMethodKind,
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
  EasypayRefund,
  EasypaySinglePayment,
} from './types.js'

const EASYPAY_PROD = 'https://api.prod.easypay.pt'
const EASYPAY_HOSTS = [EASYPAY_PROD, 'https://api.test.easypay.pt']
const REFERENCE_DAYS = 3
const CHECK_TIMEOUT_MS = 10_000
// Under the 30 seconds a checkout session is locked for while its payment starts.
const CREATE_TIMEOUT_MS = 20_000
const REFUND_TIMEOUT_MS = 20_000

const METHOD_CODES: Record<PaymentMethodKind, EasypayMethod> = {
  multibanco: 'mb',
  mbway: 'mbw',
  card: 'cc',
}

function methodFromCode(code: string | undefined): PaymentMethodKind | undefined {
  return (Object.keys(METHOD_CODES) as PaymentMethodKind[]).find(
    (kind) => METHOD_CODES[kind] === code?.toLowerCase(),
  )
}

/** Easypay's `YYYY-MM-DD HH:MM`, a little over `days` from now. */
function deadline(days: number): string {
  const date = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
  return date.toISOString().slice(0, 16).replace('T', ' ')
}

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
  method: PaymentMethodKind | undefined,
  amount: number,
  currency: string,
): PaymentSession {
  const statusStr = readStatus(p)
  return {
    id: String(p.id ?? ''),
    providerId,
    status: mapEasypayStatus(statusStr),
    ...(method && { method }),
    amount: p.value ?? amount,
    currency: (p.currency ?? currency).toUpperCase(),
    providerData: {
      entity: p.method?.entity ?? null,
      reference: p.method?.reference ?? null,
      expiresAt: p.method?.expiration_time?.replace(' ', 'T') ?? null,
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
 *   amount: 49.9, currency: 'EUR', method: 'multibanco',
 * })
 * // session.providerData.entity / .reference -> show the Multibanco reference
 * ```
 */
export class EasypayPaymentProvider implements PaymentProvider {
  readonly id = 'easypay'
  readonly name = 'Easypay'
  readonly methods = ['multibanco', 'mbway', 'card'] as const
  // Easypay needs the shopper's IBAN to pay back a Multibanco reference.
  readonly refundableMethods = ['mbway', 'card'] as const

  private readonly accountId: string
  private readonly apiKey: string
  private readonly baseUrl: string

  constructor(config: EasypayConfig) {
    this.accountId = config.accountId
    this.apiKey = config.apiKey
    // Easypay documents base URLs with the version; paths here carry it.
    this.baseUrl = (config.baseUrl ?? EASYPAY_PROD).replace(/\/+$/, '').replace(/\/2\.0$/, '')
  }

  async createSession(input: CreatePaymentSessionInput): Promise<PaymentSession> {
    const method = input.method ?? 'multibanco'
    const reference = input.orderId ?? input.idempotencyKey ?? `cart-${Date.now()}`

    const phone = method === 'mbway' ? toPortugueseMobile(input.customer?.phone) : input.customer?.phone
    if (method === 'mbway' && !phone) {
      throw new Error('Easypay: a Portuguese mobile number is required for MB WAY')
    }

    const body: Record<string, unknown> = {
      type: 'sale',
      method: METHOD_CODES[method],
      ...(method === 'multibanco' && { expiration_time: deadline(REFERENCE_DAYS) }),
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
        phone: phone ?? '',
        phone_indicative: '+351',
        key: input.customerId ?? reference,
        language: 'PT',
      },
    }

    const created = await this.request<EasypaySinglePayment>('POST', '/2.0/single', body, {
      signal: AbortSignal.timeout(CREATE_TIMEOUT_MS),
      ...(input.idempotencyKey && { headers: { 'Idempotency-Key': input.idempotencyKey } }),
    })
    const session = paymentToSession(created, this.id, method, input.amount, input.currency)
    if (method === 'multibanco' && !session.providerData?.reference) {
      throw new Error('Easypay: no Multibanco reference was returned')
    }
    return session
  }

  async confirmSession(sessionId: string): Promise<PaymentSession> {
    return this.getSession(sessionId)
  }

  async getSession(sessionId: string): Promise<PaymentSession> {
    const p = await this.request<EasypaySinglePayment>('GET', `/2.0/single/${sessionId}`)
    return paymentToSession(p, this.id, methodFromCode(p.method?.type), p.value ?? 0, p.currency ?? 'EUR')
  }

  /**
   * Refund a capture. Two guards keep a retry from paying twice: `Idempotency-Key`,
   * which Easypay documents for every POST but forgets after 24 hours, and the
   * capture's own status, which shows a refund that already went through.
   */
  async refund(input: RefundInput): Promise<void> {
    const signal = () => AbortSignal.timeout(REFUND_TIMEOUT_MS)
    const payment = await this.request<EasypaySinglePayment>(
      'GET',
      `/2.0/single/${input.sessionId}`,
      undefined,
      { signal: signal() },
    )

    const captures = payment.captures ?? []
    if (captures.some((capture) => capture.status === 'refunded')) return
    const capture = captures.find((candidate) => candidate.status === 'success')
    if (!capture?.id) throw new Error(`Easypay: payment ${input.sessionId} has no capture to refund`)

    await this.request(
      'POST',
      `/2.0/refund/${capture.id}`,
      {
        value: input.amount ?? payment.value,
        ...(input.idempotencyKey && { transaction_key: input.idempotencyKey }),
      },
      {
        signal: signal(),
        ...(input.idempotencyKey && { headers: { 'Idempotency-Key': input.idempotencyKey } }),
      },
    )
  }

  async checkCredentials(): Promise<CredentialCheck> {
    if (!EASYPAY_HOSTS.includes(this.baseUrl)) {
      return { ok: false, reason: 'rejected', field: 'baseUrl' }
    }
    try {
      const res = await fetch(`${this.baseUrl}/2.0/single?limit=1`, {
        headers: this.headers(),
        signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
      })
      if (res.ok) return { ok: true }
      return res.status === 401 || res.status === 403
        ? { ok: false, reason: 'rejected', field: 'apiKey' }
        : { ok: false, reason: 'unreachable' }
    } catch {
      return { ok: false, reason: 'unreachable' }
    }
  }

  async verifyWebhook(
    payload: string | Uint8Array,
    _signature: string,
  ): Promise<PaymentWebhookEvent> {
    // Easypay notifications are unsigned, so the body is only a trigger: the
    // payment is re-fetched from the API and that response is the source of truth.
    const bodyStr = typeof payload === 'string' ? payload : new TextDecoder().decode(payload)
    const notification = JSON.parse(bodyStr) as { id?: unknown; type?: unknown }
    if (typeof notification.id !== 'string' || notification.id.length === 0) {
      throw new Error('Easypay: notification is missing the payment id')
    }
    if (notification.type === 'refund') return this.refundEvent(notification.id)

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
      method: methodFromCode(payment.method?.type) ?? null,
      data: payment as unknown as Record<string, unknown>,
    }
  }

  /** A refund notification names the refund, which in turn names its payment. */
  private async refundEvent(refundId: string): Promise<PaymentWebhookEvent> {
    const refund = await this.request<EasypayRefund>('GET', `/2.0/refund/${encodeURIComponent(refundId)}`)
    const paymentId = refund.capture?.payment_id
    if (!paymentId) throw new Error(`Easypay: refund ${refundId} is missing its payment`)
    const payment = await this.request<EasypaySinglePayment>('GET', `/2.0/single/${encodeURIComponent(paymentId)}`)

    return {
      type: refundEventType(refund, payment),
      sessionId: paymentId,
      orderId: payment.key ?? null,
      amount: refund.value ?? null,
      currency: payment.currency ? payment.currency.toUpperCase() : null,
      refundId,
      data: refund as unknown as Record<string, unknown>,
    }
  }

  private headers(): Record<string, string> {
    return {
      'AccountId': this.accountId,
      'ApiKey': this.apiKey,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    options: { headers?: Record<string, string>; signal?: AbortSignal } = {},
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { ...this.headers(), ...options.headers },
      ...(body ? { body: JSON.stringify(body) } : {}),
      ...(options.signal && { signal: options.signal }),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      throw new Error(`Easypay API error (${res.status}): ${errorBody}`)
    }

    return res.json() as Promise<T>
  }
}

/**
 * Only a finished refund counts. Each one is compared with the capture alone,
 * so the order adds up partial refunds that together return all the money.
 */
function refundEventType(refund: EasypayRefund, payment: EasypaySinglePayment): string {
  if (refund.status !== 'success') return 'payment.updated'
  const captured = refund.capture?.value ?? payment.value
  const full = refund.value !== undefined && captured !== undefined && refund.value >= captured
  return full ? 'payment.refunded' : 'payment.partially_refunded'
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
