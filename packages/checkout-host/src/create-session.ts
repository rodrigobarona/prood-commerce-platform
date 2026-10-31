import 'server-only'
import { CheckoutSession, type CheckoutChannel, type CheckoutFulfillment } from '@prood/checkout'
import { getTenantPaymentProvider, paymentWebhookUrl, resolveCheckoutBaseUrl } from '@prood/commerce'
import { buildCheckoutSessionUrl } from './checkout-url'
import { saveSession, type SessionMeta } from './session-store'

export interface CreateSessionInput {
  /** Organization (tenant) whose payment account settles this session. */
  tenantId: string
  orderId?: string
  amount: number
  currency: string
  returnUrl?: string
  cancelUrl?: string
  /** Gateway to use; defaults to the store's first connected provider. */
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
  /** Display name of the store, shown in the checkout header. */
  storeName?: string
}

export interface CreatedSession {
  sessionId: string
  url: string
  providerId: string
  publishableKey?: string
  snapshot: ReturnType<CheckoutSession['toSnapshot']>
}

const PAYMENT_LINK_TTL_MS = 30 * 60 * 1000

async function create(
  kind: SessionMeta['kind'],
  input: CreateSessionInput,
): Promise<CreatedSession> {
  const { id: providerId, provider, config } = await getTenantPaymentProvider(
    input.tenantId,
    input.providerId,
  )
  // Unguessable: the id is the only credential for the customer-facing /c/{id} page.
  const sessionId = `${kind}_${crypto.randomUUID().replaceAll('-', '')}`
  const checkoutBaseUrl = resolveCheckoutBaseUrl()
  const webhookUrl = paymentWebhookUrl(providerId, input.tenantId)
  const isLink = kind === 'pl'

  const session = new CheckoutSession({
    paymentProvider: provider,
    currency: input.currency,
    amount: input.amount,
    returnUrl: `${checkoutBaseUrl}/confirm/${sessionId}`,
    cancelUrl: input.cancelUrl,
    orderId: input.orderId,
    webhookUrl,
    channel: isLink ? 'link' : (input.channel ?? 'web'),
    fulfillment: isLink ? 'none' : (input.fulfillment ?? 'none'),
    expiresIn: input.expiresIn ?? (isLink ? PAYMENT_LINK_TTL_MS : undefined),
  })

  if (input.customerInfo) {
    session.setCustomerInfo(input.customerInfo)
  }

  const publishableKey = providerId === 'stripe' ? config.publishableKey : undefined

  const meta: SessionMeta = {
    providerId,
    publishableKey,
    kind,
    returnUrl: input.returnUrl ?? null,
    cancelUrl: input.cancelUrl ?? null,
    webhookUrl,
    tenantId: input.tenantId,
    orderId: input.orderId ?? null,
    customerId: input.customerId ?? null,
    storeName: input.storeName ?? null,
    methods: [...provider.methods],
  }

  const snapshot = session.toSnapshot()
  await saveSession(sessionId, snapshot, meta)

  return {
    sessionId,
    url: buildCheckoutSessionUrl(checkoutBaseUrl, sessionId),
    providerId,
    publishableKey,
    snapshot,
  }
}

/** Hosted checkout session for a storefront order. */
export function createCheckoutSession(input: CreateSessionInput): Promise<CreatedSession> {
  return create('cs', input)
}

/** Shareable payment link (30 minutes by default). */
export function createPaymentLink(input: CreateSessionInput): Promise<CreatedSession> {
  return create('pl', input)
}
