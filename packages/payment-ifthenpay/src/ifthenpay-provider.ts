// ---------------------------------------------------------------------------
// IfthenpayPaymentProvider — Ifthenpay (Portugal)
// ---------------------------------------------------------------------------
//
// Methods (selected via input.method, default 'multibanco'), offered only when
// the store has the key for them:
//   - multibanco : reference        -> providerData { entity, reference, expiresAt }
//   - mbway      : push to phone    -> providerData { requestId, status }
//   - card       : hosted card page -> redirectUrl (PaymentUrl)
//
// Ifthenpay confirms payments by calling your callback URL with an
// anti-phishing key; `verifyWebhook` validates that key. Reference-based
// methods have no synchronous capture, so the callback is the source of truth.
// There is no refund API and no read-only call to test keys with: refunds happen
// in the Ifthenpay backoffice, so this provider has neither `refund` nor
// `checkCredentials`.
// ---------------------------------------------------------------------------

import type {
  PaymentMethodKind,
  PaymentProvider,
  PaymentSession,
  CreatePaymentSessionInput,
  PaymentWebhookEvent,
} from '@prood/types'
import { PAYMENT_DECLINED_PARAM, PAYMENT_DECLINED_VALUE, safeEqual, toPortugueseMobile } from '@prood/types'

import type {
  IfthenpayConfig,
  IfthenpayMbResponse,
  IfthenpayMbWayResponse,
  IfthenpayCcResponse,
} from './types.js'

const IFTHENPAY_BASE = 'https://api.ifthenpay.com'

const REFERENCE_DAYS = 3
// Under the 30 seconds a checkout session is locked for while its payment starts.
const CREATE_TIMEOUT_MS = 20_000
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function formatAmount(amount: number): string {
  return amount.toFixed(2)
}

/** Ifthenpay caps `orderId` at 25 characters; a UUID fits in base 36. */
export function encodeOrderId(orderId: string): string {
  if (!UUID.test(orderId)) return orderId
  return BigInt(`0x${orderId.replaceAll('-', '')}`).toString(36)
}

/** The order id behind a callback's `orderId`, undoing {@link encodeOrderId}. */
export function decodeOrderId(encoded: string): string {
  if (encoded.length > 25 || !/^[0-9a-z]+$/.test(encoded) || UUID.test(encoded)) return encoded
  let value = 0n
  for (const char of encoded) value = value * 36n + BigInt(Number.parseInt(char, 36))
  const hex = value.toString(16).padStart(32, '0')
  if (hex.length !== 32) return encoded
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

/** Where a declined card returns to. The confirm page offers another try from here. */
function declinedUrl(returnUrl: string | undefined): string | undefined {
  if (!returnUrl) return undefined
  const url = new URL(returnUrl)
  url.searchParams.set(PAYMENT_DECLINED_PARAM, PAYMENT_DECLINED_VALUE)
  return url.toString()
}

/** The last day a reference made today can be paid, from `DD-MM-YYYY` when given. */
function referenceDeadline(expiryDate: string | undefined): string {
  const given = /^(\d{2})-(\d{2})-(\d{4})$/.exec(expiryDate ?? '')
  if (given) return `${given[3]}-${given[2]}-${given[1]}T23:59`
  const date = new Date(Date.now() + REFERENCE_DAYS * 24 * 60 * 60 * 1000)
  return `${date.toISOString().slice(0, 10)}T23:59`
}

/**
 * Ifthenpay payment provider (Portugal).
 *
 * @example
 * ```ts
 * const ifthenpay = new IfthenpayPaymentProvider({
 *   mbKey: process.env.IFTHENPAY_MB_KEY,
 *   mbWayKey: process.env.IFTHENPAY_MBWAY_KEY,
 *   antiPhishingKey: process.env.IFTHENPAY_ANTIPHISHING_KEY!,
 * })
 * const session = await ifthenpay.createSession({
 *   amount: 49.9, currency: 'EUR', orderId: 'ord_123', method: 'multibanco',
 * })
 * ```
 */
export class IfthenpayPaymentProvider implements PaymentProvider {
  readonly id = 'ifthenpay'
  readonly name = 'Ifthenpay'
  readonly methods: readonly PaymentMethodKind[]
  readonly refundableMethods = []

  private readonly cfg: IfthenpayConfig
  private readonly baseUrl: string

  constructor(config: IfthenpayConfig) {
    this.cfg = config
    this.baseUrl = config.baseUrl ?? IFTHENPAY_BASE
    this.methods = [
      ...(config.mbKey ? (['multibanco'] as const) : []),
      ...(config.mbWayKey ? (['mbway'] as const) : []),
      ...(config.ccKey ? (['card'] as const) : []),
    ]
  }

  async createSession(input: CreatePaymentSessionInput): Promise<PaymentSession> {
    const method = input.method ?? 'multibanco'
    const orderId = encodeOrderId(input.orderId ?? input.idempotencyKey ?? `cart-${Date.now()}`)
    const amount = formatAmount(input.amount)
    const createdAt = new Date().toISOString()

    switch (method) {
      case 'multibanco': {
        if (!this.cfg.mbKey) throw new Error('Ifthenpay: mbKey is required for Multibanco')
        const res = await this.request<IfthenpayMbResponse>('POST', '/multibanco/reference/init', {
          mbKey: this.cfg.mbKey,
          orderId,
          amount,
          description: `Order ${orderId}`,
          email: input.customer?.email,
          expiryDays: REFERENCE_DAYS,
        })
        if (!res.Reference) {
          throw new Error(`Ifthenpay: no Multibanco reference was returned: ${res.Message ?? res.Status ?? 'no reason given'}`)
        }
        return {
          id: res.RequestId ?? orderId,
          providerId: this.id,
          status: 'pending',
          method,
          amount: input.amount,
          currency: input.currency.toUpperCase(),
          providerData: {
            entity: res.Entity ?? null,
            reference: res.Reference,
            expiresAt: referenceDeadline(res.ExpiryDate),
            requestId: res.RequestId ?? null,
            raw: res as unknown as Record<string, unknown>,
          },
          redirectUrl: null,
          createdAt,
        }
      }

      case 'mbway': {
        if (!this.cfg.mbWayKey) throw new Error('Ifthenpay: mbWayKey is required for MB WAY')
        const phone = toPortugueseMobile(input.customer?.phone)
        if (!phone) throw new Error('Ifthenpay: a Portuguese mobile number is required for MB WAY')
        const res = await this.request<IfthenpayMbWayResponse>('POST', '/spg/payment/mbway', {
          mbWayKey: this.cfg.mbWayKey,
          orderId,
          amount,
          mobileNumber: `351#${phone}`,
          email: input.customer?.email,
          description: `Order ${orderId}`,
        })
        if (res.Status !== '000') {
          throw new Error(`Ifthenpay: MB WAY request refused: ${res.Message ?? res.Status ?? 'no reason given'}`)
        }
        return {
          id: res.RequestId ?? orderId,
          providerId: this.id,
          status: 'pending',
          method,
          amount: input.amount,
          currency: input.currency.toUpperCase(),
          providerData: {
            requestId: res.RequestId ?? null,
            ifthenpayStatus: res.Status ?? null,
            message: res.Message ?? null,
            raw: res as unknown as Record<string, unknown>,
          },
          redirectUrl: null,
          createdAt,
        }
      }

      case 'card': {
        if (!this.cfg.ccKey) throw new Error('Ifthenpay: ccKey is required for credit card')
        const res = await this.request<IfthenpayCcResponse>('POST', `/creditcard/init/${this.cfg.ccKey}`, {
          orderId,
          amount,
          // Every outcome returns to the confirm page. Ifthenpay has no read to
          // ask afterwards, so the URL is how that page learns a card was declined.
          successUrl: input.returnUrl,
          cancelUrl: input.cancelUrl ?? declinedUrl(input.returnUrl),
          errorUrl: declinedUrl(input.returnUrl),
          description: `Order ${orderId}`,
        })
        if (!res.PaymentUrl) {
          throw new Error(`Ifthenpay: no card payment page was returned: ${res.Message ?? res.Status ?? 'no reason given'}`)
        }
        return {
          id: res.RequestId ?? orderId,
          providerId: this.id,
          status: 'requires_action',
          method,
          amount: input.amount,
          currency: input.currency.toUpperCase(),
          providerData: {
            requestId: res.RequestId ?? null,
            raw: res as unknown as Record<string, unknown>,
          },
          redirectUrl: res.PaymentUrl,
          createdAt,
        }
      }

      default:
        throw new Error(`Ifthenpay: unsupported method "${String(method)}"`)
    }
  }

  async confirmSession(sessionId: string): Promise<PaymentSession> {
    return this.getSession(sessionId)
  }

  async getSession(sessionId: string): Promise<PaymentSession> {
    // Ifthenpay reference methods have no synchronous status read; payment is
    // confirmed via the callback (verifyWebhook). Return a pending placeholder
    // so callers reconcile state from the callback / their own order record.
    return {
      id: sessionId,
      providerId: this.id,
      status: 'pending',
      amount: 0,
      currency: 'EUR',
      providerData: { note: 'Status is delivered via Ifthenpay callback' },
      redirectUrl: null,
      createdAt: new Date().toISOString(),
    }
  }

  async verifyWebhook(
    payload: string | Uint8Array,
    _signature: string,
  ): Promise<PaymentWebhookEvent> {
    const bodyStr = typeof payload === 'string' ? payload : new TextDecoder().decode(payload)
    const params = parsePayload(bodyStr)

    const key = params.key ?? params.chave ?? params.antiPhishingKey
    if (!key || !safeEqual(key, this.cfg.antiPhishingKey)) {
      throw new Error('Ifthenpay: invalid anti-phishing key on callback')
    }

    // A valid callback from Ifthenpay signals a completed payment.
    const amount = Number.parseFloat(params.amount ?? params.valor ?? '')
    const orderId = params.orderId ?? params.id
    return {
      type: 'payment.captured',
      sessionId: String(params.requestId ?? params.orderId ?? params.id ?? ''),
      orderId: orderId ? decodeOrderId(orderId) : null,
      amount: Number.isFinite(amount) ? amount : null,
      currency: 'EUR',
      data: params,
    }
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(CREATE_TIMEOUT_MS),
    })

    if (!res.ok) {
      const errorBody = await res.text()
      throw new Error(`Ifthenpay API error (${res.status}): ${errorBody}`)
    }

    return res.json() as Promise<T>
  }
}

/** Parse a callback payload that may be JSON or a query string. */
function parsePayload(body: string): Record<string, string> {
  const trimmed = body.trim()
  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed) as Record<string, unknown>
      return Object.fromEntries(
        Object.entries(obj).map(([k, v]) => [k, String(v)]),
      )
    } catch {
      // fall through to query-string parsing
    }
  }
  const qs = new URLSearchParams(trimmed.replace(/^\?/, ''))
  return Object.fromEntries(qs.entries())
}
