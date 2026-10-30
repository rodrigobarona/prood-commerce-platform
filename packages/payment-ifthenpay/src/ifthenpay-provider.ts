// ---------------------------------------------------------------------------
// IfthenpayPaymentProvider — Ifthenpay (Portugal)
// ---------------------------------------------------------------------------
//
// Methods (selected via input.metadata.method, default 'multibanco'):
//   - multibanco : reference        -> providerData { entity, reference }
//   - mbway      : push to phone    -> providerData { requestId, status }
//   - creditcard : hosted card page -> redirectUrl (PaymentUrl)
//
// Ifthenpay confirms payments by calling your callback URL with an
// anti-phishing key; `verifyWebhook` validates that key. Reference-based
// methods have no synchronous capture, so the callback is the source of truth.
// ---------------------------------------------------------------------------

import type {
  PaymentProvider,
  PaymentSession,
  CreatePaymentSessionInput,
  RefundInput,
  PaymentWebhookEvent,
} from '@prood/types'
import { safeEqual } from '@prood/types'

import type {
  IfthenpayConfig,
  IfthenpayMethod,
  IfthenpayMbResponse,
  IfthenpayMbWayResponse,
  IfthenpayCcResponse,
} from './types.js'

const IFTHENPAY_BASE = 'https://api.ifthenpay.com'

function formatAmount(amount: number): string {
  return amount.toFixed(2)
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
 *   amount: 49.9, currency: 'EUR', orderId: 'ord_123',
 *   metadata: { method: 'multibanco' },
 * })
 * ```
 */
export class IfthenpayPaymentProvider implements PaymentProvider {
  readonly id = 'ifthenpay'
  readonly name = 'Ifthenpay'

  private readonly cfg: IfthenpayConfig
  private readonly baseUrl: string
  private readonly defaultMethod: IfthenpayMethod

  constructor(config: IfthenpayConfig) {
    this.cfg = config
    this.baseUrl = config.baseUrl ?? IFTHENPAY_BASE
    this.defaultMethod = config.defaultMethod ?? 'multibanco'
  }

  async createSession(input: CreatePaymentSessionInput): Promise<PaymentSession> {
    const method = (input.metadata?.method as IfthenpayMethod | undefined) ?? this.defaultMethod
    const orderId = input.orderId ?? input.idempotencyKey ?? `cart-${Date.now()}`
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
        })
        return {
          id: res.RequestId ?? orderId,
          providerId: this.id,
          status: 'pending',
          amount: input.amount,
          currency: input.currency.toUpperCase(),
          providerData: {
            method,
            entity: res.Entity ?? null,
            reference: res.Reference ?? null,
            requestId: res.RequestId ?? null,
            raw: res as unknown as Record<string, unknown>,
          },
          redirectUrl: null,
          createdAt,
        }
      }

      case 'mbway': {
        if (!this.cfg.mbWayKey) throw new Error('Ifthenpay: mbWayKey is required for MB WAY')
        const phone = input.customer?.phone
        if (!phone) throw new Error('Ifthenpay: customer.phone is required for MB WAY')
        const res = await this.request<IfthenpayMbWayResponse>('POST', '/spg/payment/mbway', {
          MbWayKey: this.cfg.mbWayKey,
          orderId,
          amount,
          mobileNumber: phone,
          email: input.customer?.email,
          description: `Order ${orderId}`,
        })
        return {
          id: res.RequestId ?? orderId,
          providerId: this.id,
          status: 'pending',
          amount: input.amount,
          currency: input.currency.toUpperCase(),
          providerData: {
            method,
            requestId: res.RequestId ?? null,
            ifthenpayStatus: res.Status ?? null,
            message: res.Message ?? null,
            raw: res as unknown as Record<string, unknown>,
          },
          redirectUrl: null,
          createdAt,
        }
      }

      case 'creditcard': {
        if (!this.cfg.ccKey) throw new Error('Ifthenpay: ccKey is required for credit card')
        const res = await this.request<IfthenpayCcResponse>('POST', `/creditcard/init/${this.cfg.ccKey}`, {
          orderId,
          amount,
          successUrl: input.returnUrl ?? this.cfg.successUrl,
          cancelUrl: input.cancelUrl ?? this.cfg.cancelUrl,
          errorUrl: this.cfg.errorUrl,
          description: `Order ${orderId}`,
        })
        return {
          id: res.RequestId ?? orderId,
          providerId: this.id,
          status: 'requires_action',
          amount: input.amount,
          currency: input.currency.toUpperCase(),
          providerData: {
            method,
            requestId: res.RequestId ?? null,
            raw: res as unknown as Record<string, unknown>,
          },
          redirectUrl: res.PaymentUrl ?? null,
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

  async refund(_input: RefundInput): Promise<PaymentSession> {
    throw new Error('Ifthenpay: refunds are processed in the Ifthenpay backoffice, not via API')
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
    return {
      type: 'payment.captured',
      sessionId: String(params.requestId ?? params.orderId ?? params.id ?? ''),
      orderId: params.orderId ?? params.id ?? null,
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
