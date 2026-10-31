import 'server-only'
import {
  CommerceError,
  type CredentialCheck,
  type PaymentProvider,
  type PaymentWebhookEvent,
} from '@prood/types'
import { StripePaymentProvider } from '@prood/payment-stripe'
import { EasypayPaymentProvider } from '@prood/payment-easypay'
import { IfthenpayPaymentProvider } from '@prood/payment-ifthenpay'
import {
  getTenantIntegrationConfig,
  isPaymentProviderId,
  listTenantPaymentProviders,
  type PaymentProviderId,
} from './integrations'

/** A store's stored credentials for one provider, keyed by field. */
export type PaymentProviderConfig = Record<string, string>

function required(config: PaymentProviderConfig, key: string, provider: string): string {
  const value = config[key]
  if (!value) {
    throw new CommerceError(`${provider} is missing "${key}". Reconnect it in Integrations.`, 'VALIDATION', 422)
  }
  return value
}

function instantiate(id: PaymentProviderId, config: PaymentProviderConfig): PaymentProvider {
  switch (id) {
    case 'stripe':
      return new StripePaymentProvider({
        secretKey: required(config, 'secretKey', 'Stripe'),
        publishableKey: required(config, 'publishableKey', 'Stripe'),
        webhookSecret: required(config, 'webhookSecret', 'Stripe'),
      })
    case 'easypay':
      return new EasypayPaymentProvider({
        accountId: required(config, 'accountId', 'Easypay'),
        apiKey: required(config, 'apiKey', 'Easypay'),
        baseUrl: config.baseUrl,
      })
    case 'ifthenpay':
      return new IfthenpayPaymentProvider({
        antiPhishingKey: required(config, 'antiPhishingKey', 'Ifthenpay'),
        mbKey: required(config, 'mbKey', 'Ifthenpay'),
        mbWayKey: config.mbWayKey,
        ccKey: config.ccKey,
      })
  }
}

/** Base URL of the hosted checkout, where shoppers pay and webhooks arrive. */
export function resolveCheckoutBaseUrl(): string {
  const url = process.env.CHECKOUT_URL
  if (!url) throw new Error('CHECKOUT_URL is required')
  return url.replace(/\/$/, '')
}

/** Where a store's payment provider reports payments for that store. */
export function paymentWebhookUrl(providerId: string, tenantId: string): string {
  return `${resolveCheckoutBaseUrl()}/api/webhooks/${providerId}/${encodeURIComponent(tenantId)}`
}

/**
 * Test credentials before they are saved. Null when the provider has no
 * read-only call to test them with.
 */
export async function checkPaymentCredentials(
  id: PaymentProviderId,
  config: PaymentProviderConfig,
): Promise<CredentialCheck | null> {
  const provider = instantiate(id, config)
  return provider.checkCredentials ? provider.checkCredentials() : null
}

export interface TenantPaymentProvider {
  id: PaymentProviderId
  provider: PaymentProvider
  config: PaymentProviderConfig
}

/**
 * Build the payment provider bound to a store's own gateway account.
 *
 * Payments always settle into the merchant's account, so there is no
 * platform-level fallback: a store without the provider connected gets a
 * validation error. When `providerId` is omitted, the store's first connected
 * provider is used. Disabling a provider stops new payments, not the ones under
 * way: pass `includeDisabled` to finish those.
 */
export async function getTenantPaymentProvider(
  tenantId: string,
  providerId?: string,
  options?: { includeDisabled?: boolean },
): Promise<TenantPaymentProvider> {
  const id = providerId ?? (await listTenantPaymentProviders(tenantId))[0]
  if (!id) {
    throw new CommerceError('This store has no payment provider connected yet.', 'VALIDATION', 422)
  }
  if (!isPaymentProviderId(id)) {
    throw new CommerceError(`Unknown payment provider "${id}".`, 'VALIDATION', 422)
  }
  const config = await getTenantIntegrationConfig(tenantId, id, options)
  if (!config) {
    throw new CommerceError(`${id} is not connected for this store.`, 'VALIDATION', 422)
  }
  return { id, provider: instantiate(id, config), config }
}

/**
 * Verify a webhook against the store's own credentials and normalize it. A
 * provider that was disabled still reports on payments it took before then.
 */
export async function verifyPaymentWebhook(
  payload: string | Uint8Array,
  signature: string,
  providerId: string,
  tenantId: string,
): Promise<PaymentWebhookEvent> {
  const { provider } = await getTenantPaymentProvider(tenantId, providerId, { includeDisabled: true })
  if (!provider.verifyWebhook) {
    throw new Error(`Provider '${provider.id}' does not support webhook verification`)
  }
  return provider.verifyWebhook(payload, signature)
}
