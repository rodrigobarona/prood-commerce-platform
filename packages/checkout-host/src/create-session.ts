import 'server-only'
import { CheckoutSession, type CheckoutChannel, type CheckoutFulfillment } from '@prood/checkout'
import { getPaymentProvider, getTenantPaymentConfig } from '@prood/commerce'
import { buildCheckoutSessionUrl, resolveCheckoutBaseUrl } from './checkout-url'
import { saveSession, type SessionMeta } from './session-store'

let counter = 0

function generateId(kind: 'cs' | 'pl'): string {
  return `${kind}_${Date.now()}_${++counter}`
}

export interface CreateSessionInput {
  orderId?: string
  amount: number
  currency: string
  returnUrl?: string
  cancelUrl?: string
  providerId?: string
  /** Commerce customer UUID — stored in session meta, not PII */
  customerId?: string
  customerInfo?: {
    email: string
    firstName?: string
    lastName?: string
    phone?: string
  }
  channel?: CheckoutChannel
  fulfillment?: CheckoutFulfillment
  expiresIn?: number
  /** Organization (tenant) whose payment credentials should back this session. */
  tenantId?: string
  /** Display name of the store, shown in the checkout header for brand continuity. */
  storeName?: string
}

export interface CreatedSession {
  sessionId: string
  providerId: string
  publishableKey?: string
  snapshot: ReturnType<CheckoutSession['toSnapshot']>
}

export async function createCheckoutSession(input: CreateSessionInput): Promise<CreatedSession> {
  const providerId = input.providerId ?? process.env.DEFAULT_PAYMENT_PROVIDER ?? 'stripe'
  const tenantConfig = input.tenantId
    ? await getTenantPaymentConfig(input.tenantId, providerId)
    : undefined
  const provider = getPaymentProvider(providerId, tenantConfig)
  const kind = 'cs'
  const sessionId = generateId(kind)
  const checkoutBaseUrl = resolveCheckoutBaseUrl()
  const webhookUrl = `${checkoutBaseUrl}/api/webhooks/${providerId}/${input.tenantId ?? '_'}`

  const session = new CheckoutSession({
    paymentProvider: provider,
    currency: input.currency,
    amount: input.amount,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    orderId: input.orderId,
    webhookUrl,
    channel: input.channel ?? 'web',
    fulfillment: input.fulfillment ?? 'none',
    expiresIn: input.expiresIn,
  })

  if (input.customerInfo) {
    session.setCustomerInfo(input.customerInfo)
  }

  const publishableKey = providerId === 'stripe'
    ? tenantConfig?.publishableKey ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    : undefined

  const meta: SessionMeta = {
    providerId,
    publishableKey,
    kind,
    returnUrl: input.returnUrl ?? null,
    cancelUrl: input.cancelUrl ?? null,
    webhookUrl,
    tenantId: input.tenantId ?? null,
    orderId: input.orderId ?? null,
    customerId: input.customerId ?? null,
    storeName: input.storeName ?? null,
  }

  const snapshot = session.toSnapshot()
  await saveSession(sessionId, snapshot, meta)

  return { sessionId, providerId, publishableKey, snapshot }
}

export async function createPaymentLink(input: CreateSessionInput): Promise<CreatedSession & { url: string }> {
  const providerId = input.providerId ?? process.env.DEFAULT_PAYMENT_PROVIDER ?? 'stripe'
  const tenantConfig = input.tenantId
    ? await getTenantPaymentConfig(input.tenantId, providerId)
    : undefined
  const provider = getPaymentProvider(providerId, tenantConfig)
  const kind = 'pl'
  const sessionId = generateId(kind)
  const checkoutBaseUrl = resolveCheckoutBaseUrl()
  const webhookUrl = `${checkoutBaseUrl}/api/webhooks/${providerId}/${input.tenantId ?? '_'}`

  const session = new CheckoutSession({
    paymentProvider: provider,
    currency: input.currency,
    amount: input.amount,
    returnUrl: input.returnUrl,
    cancelUrl: input.cancelUrl,
    orderId: input.orderId,
    webhookUrl,
    channel: 'link',
    fulfillment: 'none',
    expiresIn: input.expiresIn ?? 30 * 60 * 1000,
  })

  if (input.customerInfo) {
    session.setCustomerInfo(input.customerInfo)
  }

  const publishableKey = providerId === 'stripe'
    ? tenantConfig?.publishableKey ?? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    : undefined

  const meta: SessionMeta = {
    providerId,
    publishableKey,
    kind,
    returnUrl: input.returnUrl ?? null,
    cancelUrl: input.cancelUrl ?? null,
    webhookUrl,
    tenantId: input.tenantId ?? null,
    orderId: input.orderId ?? null,
    customerId: input.customerId ?? null,
    storeName: input.storeName ?? null,
  }

  const snapshot = session.toSnapshot()
  await saveSession(sessionId, snapshot, meta)

  const url = buildCheckoutSessionUrl(checkoutBaseUrl, sessionId)
  return { sessionId, providerId, publishableKey, snapshot, url }
}
