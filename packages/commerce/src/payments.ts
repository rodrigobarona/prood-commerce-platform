import 'server-only'
import type { PaymentProvider, PaymentWebhookEvent } from '@commercejs/types'
import { StripePaymentProvider } from '@commercejs/payment-stripe'
import { EasypayPaymentProvider } from '@commercejs/payment-easypay'
import { IfthenpayPaymentProvider } from '@commercejs/payment-ifthenpay'
import { getTenantPaymentConfig } from './integrations'

const cache = new Map<string, PaymentProvider>()

/** Per-tenant provider credentials (from integration_config), keyed by field. */
export type PaymentProviderConfig = Record<string, string | undefined>

/** Read a value from tenant config first, then fall back to an env var. */
function pick(
  config: PaymentProviderConfig | undefined,
  key: string,
  envKey: string,
): string | undefined {
  return config?.[key] || process.env[envKey]
}

function instantiate(id: string, config?: PaymentProviderConfig): PaymentProvider {
  switch (id) {
    case 'stripe': {
      const secretKey = pick(config, 'secretKey', 'STRIPE_SECRET_KEY')
      if (!secretKey) throw new Error('Stripe secret key is not configured')
      return new StripePaymentProvider({
        secretKey,
        webhookSecret: pick(config, 'webhookSecret', 'STRIPE_WEBHOOK_SECRET'),
      })
    }
    case 'easypay': {
      const accountId = pick(config, 'accountId', 'EASYPAY_ACCOUNT_ID')
      const apiKey = pick(config, 'apiKey', 'EASYPAY_API_KEY')
      if (!accountId || !apiKey) {
        throw new Error('EasyPay account id and API key are required')
      }
      return new EasypayPaymentProvider({
        accountId,
        apiKey,
        baseUrl: pick(config, 'baseUrl', 'EASYPAY_BASE_URL'),
      })
    }
    case 'ifthenpay': {
      const antiPhishingKey = pick(
        config,
        'antiPhishingKey',
        'IFTHENPAY_ANTIPHISHING_KEY',
      )
      if (!antiPhishingKey) {
        throw new Error('IfThenPay anti-phishing key is not configured')
      }
      return new IfthenpayPaymentProvider({
        antiPhishingKey,
        mbKey: pick(config, 'mbKey', 'IFTHENPAY_MB_KEY'),
        mbWayKey: pick(config, 'mbWayKey', 'IFTHENPAY_MBWAY_KEY'),
        ccKey: pick(config, 'ccKey', 'IFTHENPAY_CC_KEY'),
      })
    }
    default:
      throw new Error(`Unknown payment provider '${id}'`)
  }
}

/**
 * Get a payment provider by id (defaults to DEFAULT_PAYMENT_PROVIDER or 'stripe').
 *
 * Pass `config` (a tenant's stored credentials) to build a provider bound to
 * that merchant's account; values fall back to env vars per field. Tenant-built
 * providers bypass the shared env cache so they never leak across tenants.
 */
export function getPaymentProvider(
  id?: string,
  config?: PaymentProviderConfig,
): PaymentProvider {
  const providerId = id ?? process.env.DEFAULT_PAYMENT_PROVIDER ?? 'stripe'
  if (config && Object.keys(config).length > 0) {
    return instantiate(providerId, config)
  }
  let provider = cache.get(providerId)
  if (!provider) {
    provider = instantiate(providerId)
    cache.set(providerId, provider)
  }
  return provider
}

/** List payment providers that have the required env configured. */
export function listConfiguredPaymentProviders(): Array<{ id: string; name: string }> {
  const providers: Array<{ id: string; name: string }> = []
  if (process.env.STRIPE_SECRET_KEY) providers.push({ id: 'stripe', name: 'Stripe' })
  if (process.env.EASYPAY_ACCOUNT_ID && process.env.EASYPAY_API_KEY) {
    providers.push({ id: 'easypay', name: 'Easypay' })
  }
  if (process.env.IFTHENPAY_ANTIPHISHING_KEY) {
    providers.push({ id: 'ifthenpay', name: 'Ifthenpay' })
  }
  return providers
}

/**
 * Verify a payment provider webhook and return the normalized event.
 *
 * Pass `tenantId` to verify against the merchant's own webhook secret (loaded
 * from their stored credentials); falls back to the platform env secret.
 */
export async function verifyPaymentWebhook(
  payload: string | Uint8Array,
  signature: string,
  providerId?: string,
  tenantId?: string,
): Promise<PaymentWebhookEvent> {
  const resolvedId = providerId ?? process.env.DEFAULT_PAYMENT_PROVIDER ?? 'stripe'
  const config = tenantId
    ? await getTenantPaymentConfig(tenantId, resolvedId)
    : undefined
  const provider = getPaymentProvider(resolvedId, config)
  if (!provider.verifyWebhook) {
    throw new Error(`Provider '${provider.id}' does not support webhook verification`)
  }
  return provider.verifyWebhook(payload, signature)
}
